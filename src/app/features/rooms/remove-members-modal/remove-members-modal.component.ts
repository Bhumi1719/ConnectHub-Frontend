import {
    Component, Input, Output, EventEmitter, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomService } from '../../../core/api/room.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { RoomMember } from '../../../shared/models/message.model';

@Component({
    selector: 'app-remove-members-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './remove-members-modal.component.html'
})
export class RemoveMembersModalComponent {
    @Input() roomId!: string;
    @Input() currentUserId!: string;
    @Input() set membersList(val: RoomMember[]) {
        this.members.set(val.filter(m => m.userId !== this.currentUserId));
    }
    @Output() close = new EventEmitter<void>();
    @Output() membersChanged = new EventEmitter<RoomMember[]>();

    members = signal<RoomMember[]>([]);
    processingIds = new Set<string>();

    constructor(
        private roomService: RoomService,
        private toastService: ToastService
    ) { }

    remove(member: RoomMember) {
        if (this.processingIds.has(member.userId)) return;
        this.processingIds.add(member.userId);

        this.roomService.removeMember(this.roomId, member.userId).subscribe({
            next: () => {
                this.members.update(list => list.filter(m => m.userId !== member.userId));
                this.toastService.show(`${member.username} removed from room.`, 'success');
                this.processingIds.delete(member.userId);
                this.membersChanged.emit(this.members());
            },
            error: (err) => {
                this.toastService.show(err.error?.message || 'Failed to remove member.', 'error');
                this.processingIds.delete(member.userId);
            }
        });
    }

    changeRole(member: RoomMember, role: 'ADMIN' | 'MEMBER') {
        this.roomService.updateMemberRole(this.roomId, member.userId, role).subscribe({
            next: () => {
                this.members.update(list =>
                    list.map(m => m.userId === member.userId ? { ...m, role } : m)
                );
                this.toastService.show(
                    `${member.username} is now ${role === 'ADMIN' ? 'an admin' : 'a member'}.`,
                    'success'
                );
                this.membersChanged.emit(this.members());
            },
            error: () => this.toastService.show('Failed to update role.', 'error')
        });
    }

    toggleMute(member: RoomMember) {
        const newMuted = !member.isMuted;
        this.roomService.muteMember(this.roomId, member.userId, newMuted).subscribe({
            next: () => {
                this.members.update(list =>
                    list.map(m => m.userId === member.userId ? { ...m, isMuted: newMuted } : m)
                );
                this.toastService.show(
                    `${member.username} ${newMuted ? 'muted' : 'unmuted'}.`,
                    'info'
                );
                this.membersChanged.emit(this.members());
            },
            error: () => this.toastService.show('Failed to update mute status.', 'error')
        });
    }

    getInitial(name: any) {
        return String(name ?? '').charAt(0).toUpperCase() || '?';
    }
}