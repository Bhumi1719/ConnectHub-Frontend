import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MediaUploadResponse, RoomMedia } from '../../shared/models/media.model';

@Injectable({ providedIn: 'root' })
export class MediaService {
    private base = environment.apiBaseUrl;

    constructor(private http: HttpClient) { }

    uploadImage(file: File, uploaderId: number | string): Observable<{ progress: number; response?: MediaUploadResponse }> {
        return this.uploadWithProgress(`${this.base}/media/upload/image`, file, uploaderId);
    }

    uploadFile(file: File, uploaderId: number | string): Observable<{ progress: number; response?: MediaUploadResponse }> {
        return this.uploadWithProgress(`${this.base}/media/upload/file`, file, uploaderId);
    }

    private uploadWithProgress(url: string, file: File, uploaderId: number | string): Observable<{ progress: number; response?: MediaUploadResponse }> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('uploaderId', String(uploaderId));

        const req = new HttpRequest('POST', url, formData, {
            reportProgress: true
        });

        return this.http.request<MediaUploadResponse>(req).pipe(
            map(event => {
                if (event.type === HttpEventType.UploadProgress && event.total) {
                    return { progress: Math.round(100 * event.loaded / event.total) };
                }
                if (event.type === HttpEventType.Response) {
                    return { progress: 100, response: event.body! };
                }
                return { progress: 0 };
            })
        );
    }

    getRoomMedia(roomId: string) {
        return this.http.get<RoomMedia[]>(`${this.base}/media/room/${roomId}`);
    }
}