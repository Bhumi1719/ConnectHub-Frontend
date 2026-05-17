export interface MediaUploadResponse {
    mediaId: string;
    url: string;
    thumbnailUrl?: string;
    filename: string;
    originalName: string;
    mimeType?: string;
    sizeKb: number;
}

export interface RoomMedia {
    mediaId: string;
    url: string;
    thumbnailUrl?: string;
    filename: string;
    originalName?: string;
    mimeType?: string;
    sizeKb: number;
    type: 'IMAGE' | 'FILE';
    uploadedAt: string;
    uploadedBy: string;
}