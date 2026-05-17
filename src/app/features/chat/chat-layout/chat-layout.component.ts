import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../../shared/stores/auth.store';
import { RoomStore } from '../../../shared/stores/room.store';
import { AuthService } from '../../../core/api/auth.service';
import { RoomListComponent } from '../room-list/room-list.component';
import { RoomService } from '../../../core/api/room.service';
import { NotificationBellComponent } from '../../notifications/notification-bell/notification-bell.component';
import { WebsocketService } from '../../../core/services/websocket.service';

@Component({
    selector: 'app-chat-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, RoomListComponent, NotificationBellComponent],
    templateUrl: './chat-layout.component.html'
})
export class ChatLayoutComponent {

    showCreateModal = false;
    newRoomName = '';
    newRoomDesc = '';
    creating = false;
    createError = '';

    constructor(
        public authStore: AuthStore,
        public roomStore: RoomStore,
        private authService: AuthService,
        private roomService: RoomService,
        private router: Router,
        private wsService: WebsocketService,
    ) { }

    ngOnInit() {
        this.wsService.connect();
        const userId = this.authStore.currentUser()?.userId;
        if (userId) {
            this.roomService.getUserRooms(userId).subscribe({
                next: (rooms) => this.roomStore.setRooms(rooms)
            });
        }
    }

    getInitial(name: any) {
        return String(name ?? '').charAt(0).toUpperCase() || '?';
    }

    openCreateModal() {
        this.showCreateModal = true;
        this.newRoomName = '';
        this.newRoomDesc = '';
        this.createError = '';
    }

    closeCreateModal() {
        this.showCreateModal = false;
    }

    createRoom() {
        if (!this.newRoomName.trim()) return;
        this.creating = true;
        this.createError = '';

        const userId = this.authStore.currentUser()!.userId;

        this.roomService.createRoom({
            name: this.newRoomName.trim(),
            description: this.newRoomDesc.trim(),
            type: 'GROUP',
            isPrivate: false,
            createdBy: userId
        }).subscribe({
            next: (res) => {
                const newRoom = { roomId: res.roomId, name: res.name, type: 'GROUP' as const };
                this.roomStore.addRoom(newRoom);
                this.roomStore.setActiveRoom(res.roomId, 'group');
                this.creating = false;
                this.showCreateModal = false;
                this.router.navigate(['/chat/room', res.roomId]);
            },
            error: (err) => {
                this.createError = err.error?.message || 'Failed to create room.';
                this.creating = false;
            }
        });
    }

    logout() {
        const userId = this.authStore.currentUser()?.userId;
        if (userId) {
            this.authService.logout(userId).subscribe();
        }
        this.authStore.logout();
        this.roomStore.clear();
        this.router.navigate(['/login']);
    }

    goToDashboard() {
        this.router.navigate(['/dashboard']);
    }

    goToProfile() {
        this.router.navigate(['/profile']);
    }
}