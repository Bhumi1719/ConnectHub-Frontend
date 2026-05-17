import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationStore } from '../../../shared/stores/notification.store';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthStore } from '../../../shared/stores/auth.store';
import { RoomStore } from '../../../shared/stores/room.store';
import { Notification } from '../../../shared/models/notification.model';

@Component({
    selector: 'app-notification-panel',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './notification-panel-component.html'
})
export class NotificationPanelComponent {
    @Output() closePanel = new EventEmitter<void>();

    constructor(
        public notificationStore: NotificationStore,
        private notificationService: NotificationService,
        private authStore: AuthStore,
        private roomStore: RoomStore,
        private router: Router
    ) { }

    markAllRead() {
        const userId = this.authStore.currentUser()?.userId;
        if (userId) this.notificationService.markAllRead(userId);
    }

    onNotificationClick(n: Notification) {
        if (!n.isRead) {
            this.notificationService.markRead(n.notificationId);
        }
        if (n.roomId) {
            this.roomStore.setActiveRoom(n.roomId);
            this.router.navigate(['/chat/room', n.roomId]);
        }
        this.closePanel.emit();
    }

    getIcon(type: Notification['type']): string {
        switch (type) {
            case 'MESSAGE': return 'chat';
            case 'JOIN_REQUEST': return 'users';
            case 'MENTION': return 'at';
            case 'ROOM_INVITE': return 'mail';
            default: return 'info';
        }
    }

    timeAgo(dateStr: string): string {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    }
}