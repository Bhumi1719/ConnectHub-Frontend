import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { User } from '../../shared/models/user.model';

export interface ProfileUpdate {
    fullName: string;
    username: string;
    bio: string;
    avatarUrl?: string;
}

export interface PasswordChange {
    currentPassword: string;
    newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
    private base = environment.apiBaseUrl;

    constructor(private http: HttpClient) { }

    getProfile(userId: string) {
        return this.http.get<User>(`${this.base}/auth/profile/${userId}`);
    }

    updateProfile(userId: string, payload: ProfileUpdate) {
        return this.http.put<User>(`${this.base}/auth/profile/${userId}`, payload);
    }

    changePassword(userId: string, payload: PasswordChange) {
        return this.http.put<any>(`${this.base}/auth/password/${userId}`, payload);
    }

    updateStatus(userId: string, status: string) {
        return this.http.put<any>(`${this.base}/auth/status/${userId}`, { status });
    }
}