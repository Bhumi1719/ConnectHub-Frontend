import { Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthStore {
    currentUser = signal<User | null>(null);
    token = signal<string | null>(null);

    constructor() {
        // Rehydrate from localStorage on app start
        const savedToken = localStorage.getItem('connecthub_token');
        const savedUser = localStorage.getItem('connecthub_user');
        if (savedToken && savedUser) {
            this.token.set(savedToken);
            this.currentUser.set(JSON.parse(savedUser));
        }
    }

    setAuth(user: User, token: string) {
        localStorage.setItem('connecthub_token', token);
        localStorage.setItem('connecthub_user', JSON.stringify(user));
        this.token.set(token);
        this.currentUser.set(user);
    }

    logout() {
        localStorage.removeItem('connecthub_token');
        localStorage.removeItem('connecthub_user');
        this.token.set(null);
        this.currentUser.set(null);
    }
}