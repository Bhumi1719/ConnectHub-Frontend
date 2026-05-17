import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../../shared/stores/auth.store';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
            <div class="text-center">
                <svg class="animate-spin w-10 h-10 text-blue-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <p class="text-slate-400 text-sm">Completing sign in...</p>
            </div>
        </div>
    `
})
export class OauthCallbackComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authStore: AuthStore
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (!token) {
        this.router.navigate(['/login']);
        return;
      }

      try {
        // Decode JWT payload (middle section)
        const payload = JSON.parse(atob(token.split('.')[1]));

        const user = {
          userId: payload.userId || payload.sub,
          username: payload.username || '',
          avatarUrl: payload.avatarUrl || '',
          email: payload.email || '',
          fullName: payload.fullName || '',
          bio: '',
          status: 'ONLINE',
          isActive: true,
          lastSeenAt: new Date().toISOString()
        };

        this.authStore.setAuth(user, token);
        this.router.navigate(['/dashboard']);
      } catch {
        this.router.navigate(['/login']);
      }
    });
  }
}