import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationStore } from '../../../shared/stores/notification.store';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthStore } from '../../../shared/stores/auth.store';
import { NotificationPanelComponent } from '../notification-panel/notification-panel-component';

@Component({
    selector: 'app-notification-bell',
    standalone: true,
    imports: [CommonModule, NotificationPanelComponent],
    templateUrl: './notification-bell.component.html'
})
export class NotificationBellComponent implements OnInit {
    open = false;

    constructor(
        public notificationStore: NotificationStore,
        private notificationService: NotificationService,
        public authStore: AuthStore
    ) { }

    ngOnInit() {
        const userId = this.authStore.currentUser()?.userId;
        if (userId) {
            this.notificationService.loadNotifications(userId);
        }
    }

    toggle() { this.open = !this.open; }
    close() { this.open = false; }
}