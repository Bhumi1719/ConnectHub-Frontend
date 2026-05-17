import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message } from '../../../shared/models/message.model';
import { ImageMessageComponent } from '../image-message/image-message.component';
import { FileMessageComponent } from '../file-message/file-message.component';

@Component({
    selector: 'app-message-bubble',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe, ImageMessageComponent, FileMessageComponent],
    templateUrl: './message-bubble.component.html'
})
export class MessageBubbleComponent {
    @Input() message!: Message;
    @Input() isOwn = false;
    @Input() isAdmin = false;
    @Input() isDm = false;   // NEW

    @Output() deleteMessage = new EventEmitter<string>();
    @Output() editMessage = new EventEmitter<{ messageId: string; content: string }>();

    showMenu = false;
    editing = false;
    editContent = '';

    startEdit() {
        this.editing = true;
        this.editContent = this.message.content;
        this.showMenu = false;
    }

    submitEdit() {
        if (this.editContent.trim() && this.editContent !== this.message.content) {
            this.editMessage.emit({ messageId: this.message.messageId, content: this.editContent.trim() });
        }
        this.editing = false;
    }

    cancelEdit() {
        this.editing = false;
    }

    onDelete() {
        this.deleteMessage.emit(this.message.messageId);
        this.showMenu = false;
    }

    getInitial(name: any) {
        return String(name ?? '').charAt(0).toUpperCase() || '?';
    }

    get displayName(): string {
        const name = this.message.senderUsername;
        if (!name || /^\d+$/.test(String(name))) {
            return 'User ' + String(name);
        }
        return String(name);
    }

    get canDelete() {
        return this.isOwn || this.isAdmin;
    }

    get canEdit() {
        return this.isOwn;
    }
}