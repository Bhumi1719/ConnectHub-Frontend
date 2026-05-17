import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RoomDirectoryEntry, Room, RoomJoinRequest } from '../../shared/models/room.model';
import { RoomMember } from '../../shared/models/message.model';

@Injectable({ providedIn: 'root' })
export class RoomService {

    private base = environment.apiBaseUrl;

    constructor(private http: HttpClient) { }

    getRoomDirectory(userId: string) {
        return this.http.get<RoomDirectoryEntry[]>(
            `${this.base}/rooms?userId=${userId}`
        );
    }

    getUserRooms(userId: string) {
        return this.http.get<Room[]>(
            `${this.base}/rooms/user/${userId}`
        );
    }

    createRoom(payload: {
        name?: string;
        description?: string;
        type: 'GROUP' | 'DM';
        isPrivate?: boolean;
        createdBy: string;
        targetUserId?: string;
    }) {
        return this.http.post<any>(`${this.base}/rooms`, payload);
    }

    sendJoinRequest(roomId: string, userId: string) {
        return this.http.post<any>(
            `${this.base}/rooms/${roomId}/request`,
            { userId }
        );
    }

    getPendingRequests(roomId: string) {
        return this.http.get<RoomJoinRequest[]>(
            `${this.base}/rooms/${roomId}/requests`
        );
    }

    approveRequest(roomId: string, userId: string) {
        return this.http.post<any>(
            `${this.base}/rooms/${roomId}/approve/${userId}`, {}
        );
    }

    rejectRequest(roomId: string, userId: string) {
        return this.http.post<any>(
            `${this.base}/rooms/${roomId}/reject/${userId}`, {}
        );
    }

    getMembers(roomId: string) {
        return this.http.get<RoomMember[]>(
            `${this.base}/rooms/${roomId}/members`
        );
    }

    leaveRoom(roomId: string, userId: string) {
        return this.http.delete(
            `${this.base}/rooms/${roomId}/members/${userId}`
        );
    }

    deleteRoom(roomId: string) {
        return this.http.delete(
            `${this.base}/rooms/${roomId}`
        );
    }

    promoteToAdmin(roomId: string, userId: string) {
        return this.http.put(
            `${this.base}/rooms/${roomId}/members/${userId}/role`,
            { role: 'ADMIN' }
        );
    }

    addMember(roomId: string, userId: string, role: 'MEMBER' | 'ADMIN' = 'MEMBER') {
        return this.http.post<any>(
            `${this.base}/rooms/${roomId}/members`,
            { userId, role }
        );
    }

    removeMember(roomId: string, userId: string) {
        return this.http.delete(
            `${this.base}/rooms/${roomId}/members/${userId}`
        );
    }

    updateMemberRole(roomId: string, userId: string, role: 'ADMIN' | 'MEMBER') {
        return this.http.put(
            `${this.base}/rooms/${roomId}/members/${userId}/role`,
            { role }
        );
    }

    muteMember(roomId: string, userId: string, isMuted: boolean) {
        return this.http.put(
            `${this.base}/rooms/${roomId}/members/${userId}/mute`,
            { isMuted }
        );
    }

    updateRoom(roomId: string, payload: { name?: string; description?: string; avatarUrl?: string; maxMembers?: number }) {
        return this.http.put<any>(
            `${this.base}/rooms/${roomId}`,
            payload
        );
    }
}