import {
    Component, Input, Output, EventEmitter,
    OnInit, signal
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RoomService } from '../../../core/api/room.service';
import { RoomStore } from '../../../shared/stores/room.store';
import { RoomJoinRequest } from '../../../shared/models/room.model';
import { RoomMember } from '../../../shared/models/message.model';

@Component({
    selector: 'app-join-requests',
    standalone: true,
    imports: [CommonModule, DatePipe],
    templateUrl: './join-requests.component.html'
})
export class JoinRequestsComponent implements OnInit {
    @Input() roomId!: string;
    @Output() close = new EventEmitter<void>();
    @Output() memberAdded = new EventEmitter<RoomMember>();

    requests = signal<RoomJoinRequest[]>([]);
    loading = true;
    processingIds = new Set<string>();

    constructor(
        private roomService: RoomService,
        private roomStore: RoomStore
    ) { }

    ngOnInit() {
        this.loadRequests();
    }

    loadRequests() {
        this.loading = true;
        this.roomService.getPendingRequests(this.roomId).subscribe({
            next: (reqs) => {
                this.requests.set(reqs.filter(r => r.status === 'PENDING'));
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    approve(req: RoomJoinRequest) {
        if (this.processingIds.has(req.userId)) return;
        this.processingIds.add(req.userId);

        this.roomService.approveRequest(this.roomId, req.userId).subscribe({
            next: () => {
                // Remove from request list
                this.requests.update(list =>
                    list.filter(r => r.userId !== req.userId)
                );
                // Notify parent to add to members panel
                this.memberAdded.emit({
                    userId: req.userId,
                    username: req.username,
                    avatarUrl: req.avatarUrl,
                    email: '',
                    role: 'MEMBER',
                    isMuted: false,
                    isOnline: false
                });
                this.processingIds.delete(req.userId);
            },
            error: () => { this.processingIds.delete(req.userId); }
        });
    }

    reject(req: RoomJoinRequest) {
        if (this.processingIds.has(req.userId)) return;
        this.processingIds.add(req.userId);

        this.roomService.rejectRequest(this.roomId, req.userId).subscribe({
            next: () => {
                this.requests.update(list =>
                    list.filter(r => r.userId !== req.userId)
                );
                this.processingIds.delete(req.userId);
            },
            error: () => { this.processingIds.delete(req.userId); }
        });
    }

    getInitial(name: any) {
        return String(name ?? '').charAt(0).toUpperCase() || '?';
    }

    get pendingCount() {
        return this.requests().length;
    }
}