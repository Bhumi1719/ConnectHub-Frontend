import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NotificationStore } from '../../shared/stores/notification.store';
import { Notification } from '../../shared/models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private base = environment.apiBaseUrl;

    constructor(
        private http: HttpClient,
        private store: NotificationStore
    ) { }

    loadNotifications(userId: string) {
        this.http.get<Notification[]>(
            `${this.base}/notifications/recipient/${userId}`
        ).subscribe({
            next: (list) => this.store.setNotifications(list)
        });
    }

    loadUnreadCount(userId: string) {
        this.http.get<{ count: number }>(
            `${this.base}/notifications/recipient/${userId}/unread-count`
        ).subscribe({
            next: ({ count }) => this.store.setUnreadCount(count)
        });
    }

    markRead(notificationId: string) {
        this.http.put(
            `${this.base}/notifications/${notificationId}/read`, {}
        ).subscribe({
            next: () => this.store.markRead(notificationId)
        });
    }

    markAllRead(userId: string) {
        this.http.put(
            `${this.base}/notifications/recipient/${userId}/read-all`, {}
        ).subscribe({
            next: () => this.store.markAllRead()
        });
    }
}