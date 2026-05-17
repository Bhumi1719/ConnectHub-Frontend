// import { Injectable } from '@angular/core';
// import { Client } from '@stomp/stompjs';
// import SockJS from 'sockjs-client';
// import { environment } from '../../../environments/environment';

// @Injectable({ providedIn: 'root' })
// export class WebSocketService {

//     private client!: Client;

//     connect(token: string) {
//         this.client = new Client({
//             webSocketFactory: () => new SockJS(environment.wsUrl),
//             connectHeaders: {
//                 Authorization: `Bearer ${token}`
//             },
//             reconnectDelay: 5000
//         });

//         this.client.onConnect = () => {
//             console.log('Connected to WebSocket');
//         };

//         this.client.activate();
//     }

//     subscribe(destination: string, callback: (msg: any) => void) {
//         this.client.subscribe(destination, message => {
//             callback(JSON.parse(message.body));
//         });
//     }

//     send(destination: string, body: any) {
//         this.client.publish({
//             destination,
//             body: JSON.stringify(body)
//         });
//     }
// }



import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../../shared/stores/auth.store';
import { NotificationStore } from '../../shared/stores/notification.store';
import { PresenceService } from './presence.service';
import { Notification } from '../../shared/models/notification.model';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
    private client: Client | null = null;
    private roomSubscriptions = new Map<string, any>();

    // Callbacks registered by components
    private roomHandlers = new Map<string, ((event: any) => void)[]>();

    constructor(
        private authStore: AuthStore,
        private notificationStore: NotificationStore,
        private presenceService: PresenceService
    ) { }

    connect() {
        if (this.client?.connected) return;
        try {

            const token = this.authStore.token();
            const userId = this.authStore.currentUser()?.userId;

            this.client = new Client({
                webSocketFactory: () =>
                    new SockJS(`${environment.wsUrl || 'http://localhost:8087'}/ws`),
                connectHeaders: { Authorization: `Bearer ${token}` },
                reconnectDelay: 5000,
                onConnect: () => {
                    // Personal queue for notifications + presence
                    if (userId) {
                        this.client!.subscribe(
                            `/topic/users/${userId}/dm`,
                            (frame: IMessage) => this.handlePersonalEvent(JSON.parse(frame.body))
                        );
                    }
                    // Re-subscribe to any rooms registered before connect
                    this.roomHandlers.forEach((_, roomId) => this.subscribeRoom(roomId));
                }
            });

            this.client.activate();
        } catch (e) {
            console.warn('WebSocket connect failed:', e);
        }
    }

    disconnect() {
        this.client?.deactivate();
        this.client = null;
        this.roomSubscriptions.clear();
    }

    /** Register a handler for events from a specific room topic */
    onRoomEvent(roomId: string, handler: (event: any) => void): () => void {
        const existing = this.roomHandlers.get(roomId) ?? [];
        this.roomHandlers.set(roomId, [...existing, handler]);

        if (this.client?.connected && !this.roomSubscriptions.has(roomId)) {
            this.subscribeRoom(roomId);
        }

        // Return unsubscribe function
        return () => {
            const handlers = (this.roomHandlers.get(roomId) ?? []).filter(h => h !== handler);
            if (handlers.length === 0) {
                this.roomHandlers.delete(roomId);
                this.roomSubscriptions.get(roomId)?.unsubscribe();
                this.roomSubscriptions.delete(roomId);
            } else {
                this.roomHandlers.set(roomId, handlers);
            }
        };
    }

    private subscribeRoom(roomId: string) {
        if (this.roomSubscriptions.has(roomId) || !this.client?.connected) return;
        const sub = this.client.subscribe(
            `/topic/rooms/${roomId}/messages`,
            (frame: IMessage) => {
                const event = JSON.parse(frame.body);
                (this.roomHandlers.get(roomId) ?? []).forEach(h => h(event));
            }
        );
        this.roomSubscriptions.set(roomId, sub);
    }

    private handlePersonalEvent(event: any) {
        switch (event.type) {
            case 'PRESENCE_UPDATE':
                this.presenceService.updatePresence({
                    userId: event.userId,
                    status: event.status,
                    lastPingAt: event.lastPingAt
                });
                break;
            default:
                // Everything else is a notification
                this.notificationStore.addNotification(event as Notification);
                break;
        }
    }

    publish(destination: string, body: object) {
        if (!this.client?.connected) return;
        this.client.publish({ destination, body: JSON.stringify(body) });
    }

    get connected() {
        return this.client?.connected ?? false;
    }
}