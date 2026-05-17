import { Injectable, signal, computed } from '@angular/core';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationStore {
    notifications = signal<Notification[]>([]);
    unreadCount = signal<number>(0);

    latestNotifications = computed(() =>
        [...this.notifications()].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
    );

    setNotifications(items: Notification[]) {
        this.notifications.set(items);
        this.unreadCount.set(items.filter(n => !n.isRead).length);
    }

    addNotification(n: Notification) {
        this.notifications.update(list => [n, ...list]);
        if (!n.isRead) this.unreadCount.update(c => c + 1);
    }

    markRead(notificationId: string) {
        this.notifications.update(list =>
            list.map(n => n.notificationId === notificationId ? { ...n, isRead: true } : n)
        );
        this.unreadCount.update(c => Math.max(0, c - 1));
    }

    markAllRead() {
        this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
        this.unreadCount.set(0);
    }

    setUnreadCount(count: number) {
        this.unreadCount.set(count);
    }
}