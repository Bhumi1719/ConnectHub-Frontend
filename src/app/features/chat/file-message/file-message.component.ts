import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-file-message',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './file-message.component.html'
})
export class FileMessageComponent {
    @Input() url!: string;
    @Input() filename = 'File';
    @Input() mimeType = '';
    @Input() sizeKb = 0;
    @Input() isOwn = false;

    get displaySize(): string {
        if (this.sizeKb < 1024) return `${this.sizeKb} KB`;
        return `${(this.sizeKb / 1024).toFixed(1)} MB`;
    }

    get fileIcon(): string {
        const m = this.mimeType.toLowerCase();
        if (m.includes('pdf')) return 'pdf';
        if (m.includes('word') || m.includes('docx')) return 'doc';
        if (m.includes('zip') || m.includes('rar')) return 'zip';
        if (m.includes('text')) return 'txt';
        return 'file';
    }

    get iconColor(): string {
        switch (this.fileIcon) {
            case 'pdf': return 'text-red-400 bg-red-500/15 border-red-500/25';
            case 'doc': return 'text-blue-400 bg-blue-500/15 border-blue-500/25';
            case 'zip': return 'text-amber-400 bg-amber-500/15 border-amber-500/25';
            default: return 'text-slate-400 bg-slate-700/50 border-white/10';
        }
    }

    download() {
        window.open(this.url, '_blank');
    }
}