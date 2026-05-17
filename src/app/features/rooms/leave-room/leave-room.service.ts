import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap, of } from 'rxjs';
import { RoomService } from '../../../core/api/room.service';
import { RoomStore } from '../../../shared/stores/room.store';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { RoomMember } from '../../../shared/models/message.model';

@Injectable({ providedIn: 'root' })
export class LeaveRoomService {

    constructor(
        private roomService: RoomService,
        private roomStore: RoomStore,
        private toastService: ToastService,
        private router: Router
    ) { }

    /**
     * Full leave logic with admin transfer rules.
     * @param roomId  the room being left
     * @param userId  the current user's ID
     * @param members current member list (already loaded in chat-window)
     */
    leave(roomId: string, userId: string, members: RoomMember[]) {
        const currentUserRole = members.find(m => m.userId === userId)?.role;
        const isAdmin = currentUserRole === 'ADMIN';
        const otherMembers = members.filter(m => m.userId !== userId);

        if (!isAdmin) {
            // Simple leave
            this.doLeave(roomId, userId);
            return;
        }

        if (otherMembers.length === 0) {
            // Admin is last member — delete the room
            this.roomService.deleteRoom(roomId).subscribe({
                next: () => {
                    this.afterLeave(roomId);
                    this.toastService.show('Room deleted — you were the last member.', 'info');
                },
                error: () => this.toastService.show('Failed to delete room.', 'error')
            });
            return;
        }

        // Admin leaving — promote next member first
        // Sort by joinedAt asc to find who joined earliest
        const sorted = [...otherMembers].sort((a, b) => {
            const aTime = (a as any).joinedAt ? new Date((a as any).joinedAt).getTime() : 0;
            const bTime = (b as any).joinedAt ? new Date((b as any).joinedAt).getTime() : 0;
            return aTime - bTime;
        });
        const nextAdmin = sorted[0];

        this.roomService.promoteToAdmin(roomId, nextAdmin.userId).pipe(
            switchMap(() => this.roomService.leaveRoom(roomId, userId))
        ).subscribe({
            next: () => {
                this.toastService.show(
                    `${nextAdmin.username} is now the admin.`,
                    'success'
                );
                this.afterLeave(roomId);
            },
            error: () => this.toastService.show('Failed to transfer admin and leave.', 'error')
        });
    }

    private doLeave(roomId: string, userId: string) {
        this.roomService.leaveRoom(roomId, userId).subscribe({
            next: () => this.afterLeave(roomId),
            error: () => this.toastService.show('Failed to leave room.', 'error')
        });
    }

    private afterLeave(roomId: string) {
        this.roomStore.removeRoom(roomId);
        this.router.navigate(['/dashboard']);
    }
}