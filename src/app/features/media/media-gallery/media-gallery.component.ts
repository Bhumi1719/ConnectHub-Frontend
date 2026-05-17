import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaService } from '../../../core/api/media.service';
import { RoomMedia } from '../../../shared/models/media.model';

@Component({
    selector: 'app-media-gallery',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './media-gallery.component.html'
})
export class MediaGalleryComponent implements OnInit {
    @Input() roomId!: string;
    @Output() close = new EventEmitter<void>();

    allMedia = signal<RoomMedia[]>([]);
    images = signal<RoomMedia[]>([]);
    loading = true;

    lightboxUrl: string | null = null;
    lightboxName: string | null = null;

    constructor(private mediaService: MediaService) { }

    ngOnInit() {
        this.mediaService.getRoomMedia(this.roomId).subscribe({
            next: (media) => {
                console.log('[MediaGallery] raw response:', media);
                const list = Array.isArray(media) ? media : (media as any)?.content ?? [];
                this.allMedia.set(list);
                this.images.set(list.filter((m: any) => this.isImage(m)));
                this.loading = false;
            },
            error: (err) => {
                console.error('[MediaGallery] error:', err);
                this.loading = false;
            }
        });
    }

    private isImage(m: any): boolean {
        const type = String(m.type ?? '').toUpperCase();
        if (type === 'IMAGE') return true;
        const mime = String(m.mimeType ?? '').toLowerCase();
        if (mime.startsWith('image/')) return true;
        const url = String(m.url ?? '').toLowerCase();
        return /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/.test(url);
    }

    getDisplayName(img: RoomMedia): string {
        return img.originalName || img.filename || 'Image';
    }

    openLightbox(img: RoomMedia) {
        this.lightboxUrl = img.url;
        this.lightboxName = this.getDisplayName(img);
    }

    closeLightbox() {
        this.lightboxUrl = null;
        this.lightboxName = null;
    }
}