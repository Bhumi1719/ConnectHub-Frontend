import {
    Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/api/auth.service';
import { RoomService } from '../../../core/api/room.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { RoomMember } from '../../../shared/models/message.model';
import { User } from '../../../shared/models/user.model';

@Component({
    selector: 'app-add-members-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './add-members-modal.component.html'
})
export class AddMembersModalComponent implements OnInit, OnDestroy {
    @Input() roomId!: string;
    @Input() existingMemberIds: string[] = [];
    @Output() close = new EventEmitter<void>();
    @Output() memberAdded = new EventEmitter<RoomMember>();

    searchControl = new FormControl('');
    results = signal<User[]>([]);
    searching = false;
    addingIds = new Set<string>();

    private destroy$ = new Subject<void>();

    constructor(
        private authService: AuthService,
        private roomService: RoomService,
        private toastService: ToastService
    ) { }

    ngOnInit() {
        this.searchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(q => {
                if (!q || q.trim().length < 1) {
                    this.results.set([]);
                    this.searching = false;
                    return [];
                }
                this.searching = true;
                return this.authService.searchUsers(q.trim());
            }),
            takeUntil(this.destroy$)
        ).subscribe({
            next: (users) => {
                this.results.set(users);
                this.searching = false;
            },
            error: () => { this.searching = false; }
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    isAlreadyMember(userId: string) {
        return this.existingMemberIds.includes(userId);
    }

    addMember(user: User) {
        if (this.isAlreadyMember(user.userId) || this.addingIds.has(user.userId)) return;
        this.addingIds.add(user.userId);

        this.roomService.addMember(this.roomId, user.userId).subscribe({
            next: () => {
                const newMember: RoomMember = {
                    userId: user.userId,
                    username: user.username,
                    email: user.email,
                    avatarUrl: user.avatarUrl,
                    role: 'MEMBER',
                    isMuted: false,
                    isOnline: false
                };
                this.memberAdded.emit(newMember);
                this.existingMemberIds = [...this.existingMemberIds, user.userId];
                this.toastService.show(`${user.username} added to room.`, 'success');
                this.addingIds.delete(user.userId);
            },
            error: (err) => {
                this.toastService.show(err.error?.message || 'Failed to add member.', 'error');
                this.addingIds.delete(user.userId);
            }
        });
    }

    getInitial(name: any) {
        return String(name ?? '').charAt(0).toUpperCase() || '?';
    }
}