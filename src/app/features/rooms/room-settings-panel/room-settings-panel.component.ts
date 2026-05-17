import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RoomService } from '../../../core/api/room.service';
import { RoomStore } from '../../../shared/stores/room.store';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { Room } from '../../../shared/models/room.model';

@Component({
    selector: 'app-room-settings-panel',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './room-settings-panel.component.html'
})
export class RoomSettingsPanelComponent implements OnInit {
    @Input() roomId!: string;
    @Input() room!: Room;
    @Output() close = new EventEmitter<void>();

    form!: FormGroup;
    saving = false;

    constructor(
        private fb: FormBuilder,
        private roomService: RoomService,
        private roomStore: RoomStore,
        private toastService: ToastService
    ) { }

    ngOnInit() {
        this.form = this.fb.group({
            name: [this.room?.name || '', [Validators.required, Validators.minLength(2)]],
            description: [this.room?.description || ''],
            maxMembers: [this.room?.maxMembers || 100, [Validators.min(2), Validators.max(500)]]
        });
    }

    save() {
        if (this.form.invalid) return;
        this.saving = true;

        const { name, description, maxMembers } = this.form.value;

        this.roomService.updateRoom(this.roomId, {
            name: name.trim(),
            description: description?.trim() || '',
            maxMembers
        }).subscribe({
            next: () => {
                this.roomStore.updateRoom(this.roomId, { name: name.trim(), description: description?.trim() || '' });
                this.toastService.show('Room settings saved.', 'success');
                this.saving = false;
                this.close.emit();
            },
            error: (err) => {
                this.toastService.show(err.error?.message || 'Failed to save settings.', 'error');
                this.saving = false;
            }
        });
    }

    isInvalid(field: string) {
        const c = this.form.get(field);
        return c?.invalid && c?.touched;
    }
}