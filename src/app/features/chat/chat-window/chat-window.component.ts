import {
    Component, OnInit, OnDestroy, signal, computed,
    ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AuthStore } from '../../../shared/stores/auth.store';
import { RoomStore } from '../../../shared/stores/room.store';
import { Message, RoomMember } from '../../../shared/models/message.model';
import { environment } from '../../../../environments/environment';
import { WebsocketService } from '../../../core/services/websocket.service';
import { PresenceService } from '../../../core/services/presence.service';
import { RoomService } from '../../../core/api/room.service';
import { LeaveRoomService } from '../../rooms/leave-room/leave-room.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

import { MessageListComponent } from '../message-list/message-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';
import { JoinRequestsComponent } from '../../rooms/join-requests/join-requests.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { AddMembersModalComponent } from '../../rooms/add-members-modal/add-members-modal.component';
import { RemoveMembersModalComponent } from '../../rooms/remove-members-modal/remove-members-modal.component';
import { RoomSettingsPanelComponent } from '../../rooms/room-settings-panel/room-settings-panel.component';
import { MediaUploadResponse } from '../../../shared/models/media.model';
import { MediaGalleryComponent } from '../../media/media-gallery/media-gallery.component';

@Component({
    selector: 'app-chat-window',
    standalone: true,
    host: {
        class: 'flex flex-col flex-1 min-h-0 overflow-hidden',
        style: 'height: 100%'
    },
    imports: [
        CommonModule, FormsModule,
        MessageListComponent, MessageInputComponent, TypingIndicatorComponent,
        JoinRequestsComponent, ConfirmModalComponent,
        AddMembersModalComponent, RemoveMembersModalComponent, RoomSettingsPanelComponent, MediaGalleryComponent
    ],
    templateUrl: './chat-window.component.html',
    providers: [DatePipe]
})
export class ChatWindowComponent implements OnInit, OnDestroy {

    roomId = '';
    messages = signal<Message[]>([]);
    members = signal<RoomMember[]>([]);
    typingUsers = signal<string[]>([]);

    showMembers = false;
    showMenu = false;
    showDeleteConfirm = false;
    showJoinRequests = false;
    showAddMembers = false;
    showRemoveMembers = false;
    showRoomSettings = false;

    page = 0;
    pageSize = 20;
    hasMore = true;
    loadingMessages = false;
    loadingMembers = false;

    pendingRequestCount = signal(0);
    showMediaGallery = false;

    private typingTimeout: any;
    private unsubscribeRoom?: () => void;

    currentUserRole = computed(() => {
        const uid = this.authStore.currentUser()?.userId;
        return this.members().find(m => m.userId === uid)?.role ?? 'MEMBER';
    });

    isAdmin = computed(() => this.currentUserRole() === 'ADMIN');

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private http: HttpClient,
        private roomService: RoomService,
        private leaveRoomService: LeaveRoomService,
        private toastService: ToastService,
        public authStore: AuthStore,
        public roomStore: RoomStore,
        public presenceService: PresenceService,
        private wsService: WebsocketService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.wsService.connect();

        this.route.params.subscribe(params => {
            const newRoomId = params['roomId'];
            if (newRoomId && newRoomId !== this.roomId) {
                this.roomId = newRoomId;
                this.reset();
                this.init();
            }
        });
    }

    ngOnDestroy() {
        this.unsubscribeRoom?.();
        clearTimeout(this.typingTimeout);
    }

    private reset() {
        this.unsubscribeRoom?.();
        this.messages.set([]);
        this.members.set([]);
        this.typingUsers.set([]);
        this.page = 0;
        this.hasMore = true;
        this.showMembers = false;
        this.showMenu = false;
    }

    private init() {
        this.loadMembers();
        this.roomStore.setActiveRoom(this.roomId);
        // Load messages after members so usernames resolve
        setTimeout(() => this.loadMessages(), 100);
        this.markRead();

        this.unsubscribeRoom = this.wsService.onRoomEvent(
            this.roomId,
            (event) => this.handleEvent(event)
        );
        setTimeout(() => this.markRead(), 1000);
        setTimeout(() => this.loadPendingRequestCount(), 500);
    }

    // ── Messages ──────────────────────────────────────────────

    loadMessages(prepend = false) {
        if (this.loadingMessages || !this.hasMore) return;
        this.loadingMessages = true;

        this.http.get<Message[]>(
            `${environment.apiBaseUrl}/messages/room/${this.roomId}?page=${this.page}&size=${this.pageSize}`
        ).subscribe({
            next: (msgs: any) => {
                const raw: any[] = Array.isArray(msgs) ? msgs : (msgs.content ?? msgs.data ?? []);
                const list: Message[] = raw.map(m => ({
                    ...m,
                    messageId: String(m.messageId ?? m.id),
                    senderId: String(m.senderId),
                    senderUsername: this.getUsernameById(String(m.senderId)),
                    status: m.deliveryStatus ?? m.status ?? 'SENT',
                    isDeleted: m.isDeleted ?? false,
                    isEdited: m.isEdited ?? false,
                    createdAt: m.sentAt ?? m.createdAt ?? new Date().toISOString()
                }));
                const sorted = [...list].reverse();
                if (prepend) {
                    this.messages.update(existing => [...sorted, ...existing]);
                } else {
                    this.messages.set(sorted);
                }
                this.hasMore = list.length === this.pageSize;
                this.page++;
                this.loadingMessages = false;
            },
            error: (err) => {
                console.error('loadMessages error:', err);
                this.loadingMessages = false;
            }
        });
    }

    loadMoreMessages() { this.loadMessages(true); }

    // ── Members ───────────────────────────────────────────────

    // loadMembers() {
    //     this.loadingMembers = true;
    //     this.http.get<RoomMember[]>(
    //         `${environment.apiBaseUrl}/rooms/${this.roomId}/members`
    //     ).subscribe({
    //         next: (m) => {
    //             this.members.set(m);
    //             this.loadingMembers = false;
    //             // Fetch presence for all members
    //             this.presenceService.fetchBulkPresence(m.map(x => x.userId));
    //         },
    //         error: () => { this.loadingMembers = false; }
    //     });
    // }

    private loadMembers() {
        this.roomService.getMembers(this.roomId).subscribe({
            next: (members) => {
                this.members.set(members);
                this.loadingMembers = false;
                this.cdr.detectChanges();

                // ✅ Fix DM name in store so sidebar also shows correct username
                if (this.activeRoomType === 'DM') {
                    const currentUserId = this.authStore.currentUser()?.userId;
                    const partner = members.find(m => String(m.userId) !== String(currentUserId));
                    if (partner) {
                        this.roomStore.updateRoom(this.roomId, { name: partner.username });
                    }
                }
            },
            error: () => {
                this.loadingMembers = false;
                this.cdr.detectChanges();
            }
        });
    }

    markRead() {
        const userId = this.authStore.currentUser()?.userId;
        if (!userId) return;
        this.http.put(
            `${environment.apiBaseUrl}/rooms/${this.roomId}/lastread/${userId}`, {}
        ).subscribe({
            error: (err) => console.warn('markRead failed (non-critical):', err.status)
        });
    }

    sendReadReceipt() {
        const msgs = this.messages();
        if (!msgs.length) return;
        const lastId = msgs[msgs.length - 1].messageId;
        const userId = this.authStore.currentUser()?.userId;
        this.wsService.publish('/app/chat.read', {
            readerId: userId,
            roomId: this.roomId,
            upToMessageId: lastId
        });
    }

    // ── Event handling ─────────────────────────────────────────

    private handleEvent(event: any) {
        const t = event.eventType ?? event.type;
        switch (t) {
            case 'MESSAGE_SENT':
            case 'CHAT_MESSAGE':
                const msg = this.mapToMessage(event);
                this.messages.update(msgs => [...msgs, msg]);
                break;
            case 'TYPING_INDICATOR':
                this.handleTyping(event);
                break;
            case 'READ_RECEIPT':
                this.handleReadReceipt(event);
                break;
            case 'MESSAGE_DELETED':
            case 'MESSAGE_DELETE':
                this.messages.update(msgs =>
                    msgs.map(m => String(m.messageId) === String(event.messageId)
                        ? { ...m, isDeleted: true, content: '' } : m));
                break;
            case 'MESSAGE_EDITED':
            case 'MESSAGE_EDIT':
                this.messages.update(msgs =>
                    msgs.map(m => String(m.messageId) === String(event.messageId)
                        ? { ...m, content: event.content, isEdited: true } : m));
                break;
            case 'PRESENCE_UPDATE':
                this.presenceService.updatePresence({
                    userId: event.userId,
                    status: event.status
                });
                break;
        }
    }

    private mapToMessage(event: any): any {
        return {
            messageId: String(event.messageId),
            roomId: String(event.roomId),
            senderId: String(event.senderId),
            senderUsername: (event.senderUsername && !/^\d+$/.test(String(event.senderUsername)))
                ? String(event.senderUsername)
                : this.getUsernameById(String(event.senderId)),
            senderAvatarUrl: event.senderAvatarUrl ?? null,
            content: event.content ?? '',
            type: event.type ?? 'TEXT',
            mediaUrl: event.mediaUrl ?? null,
            status: event.deliveryStatus ?? 'SENT',
            isDeleted: false,
            isEdited: false,
            createdAt: event.sentAt ?? new Date().toISOString()
        };
    }

    private handleTyping(event: any) {
        const uid = this.authStore.currentUser()?.userId;
        if (event.senderId === uid) return;

        const username = event.senderUsername;
        if (event.isTyping) {
            this.typingUsers.update(u =>
                u.includes(username) ? u : [...u, username]);
            clearTimeout(this.typingTimeout);
            this.typingTimeout = setTimeout(
                () => this.typingUsers.set([]), 3000
            );
        } else {
            this.typingUsers.update(u => u.filter(n => n !== username));
        }
    }

    private handleReadReceipt(event: any) {
        // Mark all messages up to upToMessageId as READ
        const upTo = event.upToMessageId;
        let found = false;
        this.messages.update(msgs =>
            msgs.map(m => {
                if (!found) {
                    if (m.messageId === upTo) found = true;
                    return { ...m, status: 'READ' as const };
                }
                return m;
            })
        );
    }

    // ── Send ──────────────────────────────────────────────────

    sendMessage(content: string) {
        if (!content.trim()) return;
        const userId = this.authStore.currentUser()?.userId;
        console.log('sending message wsConnected:', this.wsService.connected, 'userId:', userId, 'roomId:', this.roomId);

        this.wsService.publish('/app/chat.send', {
            senderId: Number(userId),
            roomId: Number(this.roomId),
            content: content.trim(),
            type: 'TEXT'
        });
    }

    sendMediaMessage(data: { response: MediaUploadResponse; isImage: boolean }) {
        const userId = this.authStore.currentUser()?.userId;
        const { response, isImage } = data;

        // The API returns a relative path like /media/files/xxx.png — prefix with base URL
        const baseUrl = environment.apiBaseUrl;
        const toAbsolute = (path: string) =>
            path && path.startsWith('/') ? `${baseUrl}${path}` : path;

        this.wsService.publish('/app/chat.send', {
            senderId: userId,
            roomId: this.roomId,
            content: response.originalName || response.filename,
            type: isImage ? 'IMAGE' : 'FILE',
            mediaUrl: toAbsolute(response.url),
            thumbnailUrl: response.thumbnailUrl ? toAbsolute(response.thumbnailUrl) : null,
            mimeType: response.mimeType ?? '',
            sizeKb: response.sizeKb
        });
    }

    sendTyping(isTyping: boolean) {
        const user = this.authStore.currentUser();
        this.wsService.publish('/app/chat.typing', {
            senderId: user?.userId,
            senderUsername: user?.username,
            roomId: this.roomId,
            isTyping
        });
    }

    deleteMessage(messageId: string) {
        this.http.delete(
            `${environment.apiBaseUrl}/messages/${messageId}`
        ).subscribe();
    }

    editMessage(messageId: string, content: string) {
        this.http.put(
            `${environment.apiBaseUrl}/messages/${messageId}`,
            { content }
        ).subscribe();
    }

    // ── Room management ───────────────────────────────────────

    leaveRoom() {
        this.showMenu = false;
        const userId = this.authStore.currentUser()?.userId;
        if (!userId) return;
        this.leaveRoomService.leave(this.roomId, userId, this.members());
    }

    deleteRoom() {
        this.showDeleteConfirm = false;
        this.roomService.deleteRoom(this.roomId).subscribe({
            next: () => {
                this.roomStore.removeRoom(this.roomId);
                this.toastService.show(`"${this.activeRoomName}" was deleted.`, 'success');
                this.router.navigate(['/dashboard']);
            },
            error: () => this.toastService.show('Failed to delete room.', 'error')
        });
    }

    loadPendingRequestCount() {
        if (!this.isAdmin()) return;
        this.roomService.getPendingRequests(this.roomId).subscribe({
            next: (reqs) => {
                this.pendingRequestCount.set(
                    reqs.filter((r: any) => r.status === 'PENDING').length
                );
            },
            error: () => { }
        });
    }

    onMemberAdded(member: RoomMember) {
        this.members.update(existing => [...existing, member]);
        this.pendingRequestCount.update(c => Math.max(0, c - 1));
    }

    onMembersChanged(updated: RoomMember[]) {
        this.members.set([
            ...this.members().filter(m => m.userId === this.authStore.currentUser()?.userId),
            ...updated
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────
    getUsernameById(senderId: string): string {
        const member = this.members().find(m => String(m.userId) === String(senderId));
        return member?.username ?? 'User ' + senderId;
    }
    getInitial(name: any) {
        return String(name ?? '').charAt(0).toUpperCase() || '?';
    }

    // get activeRoomName() {
    //     return this.roomStore.activeRoom()?.name
    //         ?? this.roomStore.rooms().find(r => r.roomId === this.roomId)?.name
    //         ?? 'Room';
    // }

    get activeRoomName() {
        const room = this.roomStore.activeRoom()
            ?? this.roomStore.rooms().find(r => r.roomId === this.roomId);

        if (room?.type === 'DM') {
            // Derive name from members — pick the one who isn't the current user
            const currentUserId = this.authStore.currentUser()?.userId;
            const partner = this.members().find(m => String(m.userId) !== String(currentUserId));
            return partner?.username ?? room.name ?? 'Direct Message';
        }

        return room?.name ?? 'Room';
    }

    get activeRoomType() {
        return this.roomStore.activeRoom()?.type
            ?? this.roomStore.rooms().find(r => r.roomId === this.roomId)?.type
            ?? 'GROUP';
    }
}