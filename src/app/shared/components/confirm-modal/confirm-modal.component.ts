import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-confirm-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './confirm-modal.componet.html'
})
export class ConfirmModalComponent {
    @Input() title = 'Are you sure?';
    @Input() message = 'This action cannot be undone.';
    @Input() confirmLabel = 'Confirm';
    @Input() cancelLabel = 'Cancel';
    @Input() danger = true;

    @Output() confirmed = new EventEmitter<boolean>();

    confirm() { this.confirmed.emit(true); }
    cancel() { this.confirmed.emit(false); }
}