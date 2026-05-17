import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Presence } from '../../shared/models/notification.model';

@Injectable({ providedIn: 'root' })
export class PresenceService {
    presenceMap = signal<Map<string, Presence>>(new Map());

    constructor(private http: HttpClient) { }

    fetchBulkPresence(userIds: string[]) {
        if (!userIds.length) return;
        this.http.post<Presence[]>(
            `${environment.apiBaseUrl}/presence/bulk`,
            { userIds }
        ).subscribe({
            next: (list) => {
                setTimeout(() => {
                    this.presenceMap.update(map => {
                        const updated = new Map(map);
                        list.forEach(p => updated.set(p.userId, p));
                        return updated;
                    });
                }, 0);
            }
        });
    }

    updatePresence(presence: Presence) {
        this.presenceMap.update(map => {
            const updated = new Map(map);
            updated.set(presence.userId, presence);
            return updated;
        });
    }

    getStatus(userId: string): Presence['status'] {
        return this.presenceMap().get(userId)?.status ?? 'OFFLINE';
    }

    isOnline(userId: string): boolean {
        return this.getStatus(userId) === 'ONLINE';
    }

    getStatusColor(userId: string): string {
        const status = this.getStatus(userId);
        switch (status) {
            case 'ONLINE': return 'bg-emerald-400';
            case 'AWAY': return 'bg-amber-400';
            case 'DND': return 'bg-red-400';
            default: return 'bg-slate-600';
        }
    }
}