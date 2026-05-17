import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-image-message',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './image-message.component.html'
})
export class ImageMessageComponent {
    @Input() set thumbnailUrl(val: string) { this._thumbUrl = this.toAbsolute(val); }
    @Input() set fullUrl(val: string) { this._fullUrl = this.toAbsolute(val); }
    @Input() filename = 'Image';

    _thumbUrl = '';
    _fullUrl = '';

    lightboxOpen = signal(false);
    imgError = signal(false);

    open() { this.lightboxOpen.set(true); }
    close() { this.lightboxOpen.set(false); }
    onError() { this.imgError.set(true); }

    private toAbsolute(path: string): string {
        if (!path) return '';
        return path.startsWith('/') ? `${environment.apiBaseUrl}${path}` : path;
    }
}