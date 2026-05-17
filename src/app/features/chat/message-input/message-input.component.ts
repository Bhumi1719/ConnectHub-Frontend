import { Component, Output, EventEmitter, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileUploadButtonComponent } from '../../media/file-upload-button/file-upload-button.component';
import { MediaService } from '../../../core/api/media.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { MediaUploadResponse } from '../../../shared/models/media.model';

@Component({
    selector: 'app-message-input',
    standalone: true,
    imports: [CommonModule, FormsModule, FileUploadButtonComponent],
    templateUrl: './message-input.component.html'
})
export class MessageInputComponent {
    @Input() roomId = '';
    @Input() uploaderId!: number | string;
    @Output() mediaSent = new EventEmitter<{ response: MediaUploadResponse; isImage: boolean }>();
    @Output() sendMessage = new EventEmitter<string>();
    @Output() typingChange = new EventEmitter<boolean>();

    content = signal('');
    showEmojiPicker = signal(false);
    uploading = signal(false);
    uploadProgress = signal(0);
    private typingTimeout: any;

    // File chosen by user — held locally until send is clicked
    pendingFile: { file: File; isImage: boolean; previewUrl: string } | null = null;

    constructor(
        private mediaService: MediaService,
        private toastService: ToastService
    ) { }

    readonly emojis = [
        '😀', '😂', '😍', '🥰', '😎', '🤔', '😅', '😭', '😊', '🥳',
        '👍', '👎', '❤️', '🔥', '✨', '🎉', '🙏', '💯', '😴', '🤣',
        '😇', '🤩', '😏', '😒', '🙄', '😤', '😡', '🥺', '😱', '🤯',
        '👋', '✌️', '🤝', '💪', '🎊', '🎈', '💡', '⭐', '🌟', '💬',
        '😋', '🤤', '😔', '😪', '🤧', '🥴', '😵', '🤠', '🥸', '😬',
        '🫡', '🫢', '🫣', '🤭', '🫠', '😶', '😐', '😑', '🙃', '🤑'
    ];

    toggleEmojiPicker() { this.showEmojiPicker.update(v => !v); }
    insertEmoji(emoji: string) { this.content.update(c => c + emoji); this.showEmojiPicker.set(false); }
    closeEmojiPicker() { this.showEmojiPicker.set(false); }

    onInput(value: string) {
        this.content.set(value);
        this.typingChange.emit(true);
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => this.typingChange.emit(false), 2000);
    }

    /** File picked — show local preview, don't upload yet */
    onFileSelected(data: { file: File; isImage: boolean }) {
        const previewUrl = data.isImage ? URL.createObjectURL(data.file) : '';
        // Revoke previous blob URL if any
        if (this.pendingFile?.previewUrl) URL.revokeObjectURL(this.pendingFile.previewUrl);
        this.pendingFile = { ...data, previewUrl };
    }

    cancelPendingFile() {
        if (this.pendingFile?.previewUrl) URL.revokeObjectURL(this.pendingFile.previewUrl);
        this.pendingFile = null;
    }

    /** Send clicked — upload first, then emit for WebSocket dispatch */
    send() {
        if (this.pendingFile) {
            this.uploadAndSend();
            return;
        }
        const msg = this.content().trim();
        if (!msg) return;
        this.sendMessage.emit(msg);
        this.content.set('');
        clearTimeout(this.typingTimeout);
        this.typingChange.emit(false);
    }

    private uploadAndSend() {
        if (!this.pendingFile || !this.uploaderId) return;

        const { file, isImage } = this.pendingFile;
        this.uploading.set(true);
        this.uploadProgress.set(0);

        const upload$ = isImage
            ? this.mediaService.uploadImage(file, this.uploaderId)
            : this.mediaService.uploadFile(file, this.uploaderId);

        upload$.subscribe({
            next: ({ progress, response }) => {
                this.uploadProgress.set(progress);
                if (response) {
                    this.uploading.set(false);
                    this.cancelPendingFile();
                    this.mediaSent.emit({ response, isImage });
                    this.toastService.show(`${isImage ? 'Image' : 'File'} sent.`, 'success');
                }
            },
            error: () => {
                this.uploading.set(false);
                this.toastService.show('Upload failed. Please try again.', 'error');
            }
        });
    }

    onKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.send();
        }
    }

    get canSend(): boolean {
        return (!!this.pendingFile || !!this.content().trim()) && !this.uploading();
    }

    get fileSizeKb(): number {
        return this.pendingFile ? Math.round(this.pendingFile.file.size / 1024) : 0;
    }
}