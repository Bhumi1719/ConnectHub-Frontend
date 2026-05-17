import {
    Component, Input, Output, EventEmitter,
    ViewChild, ElementRef, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';

const MAX_SIZE_MB = 25;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

@Component({
    selector: 'app-file-upload-button',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './file-upload-button.component.html'
})
export class FileUploadButtonComponent {
    @Input() roomId!: string;
    @Input() uploaderId!: number | string;
    // Now emits the raw File so the parent can preview first and upload on send
    @Output() fileSelected = new EventEmitter<{ file: File; isImage: boolean }>();

    @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

    constructor() { }

    openPicker() {
        this.fileInputRef.nativeElement.value = '';
        this.fileInputRef.nativeElement.click();
    }

    onFileSelected(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const sizeMb = file.size / (1024 * 1024);
        if (sizeMb > MAX_SIZE_MB) {
            alert(`File exceeds ${MAX_SIZE_MB}MB limit.`);
            return;
        }

        const isImage = IMAGE_TYPES.includes(file.type);
        this.fileSelected.emit({ file, isImage });
    }
}