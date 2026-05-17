import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    {
        path: 'login',
        loadComponent: () =>
            import('./features/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: () =>
            import('./features/auth/register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: 'oauth2/callback',
        loadComponent: () =>
            import('./features/auth/oauth-callback/oauth-callback-component').then(m => m.OauthCallbackComponent)
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./features/dashboard/dashboard.component').then(m => m.Dashboard),
        canActivate: [authGuard]
    },
    {
        path: 'chat',
        loadComponent: () =>
            import('./features/chat/chat-layout/chat-layout.component').then(m => m.ChatLayoutComponent),
        canActivate: [authGuard],
        children: [
            {
                path: 'room/:roomId',
                loadComponent: () =>
                    import('./features/chat/chat-window/chat-window.component').then(m => m.ChatWindowComponent)
            }
        ]
    },
    {
        path: 'profile',
        loadComponent: () =>
            import('./features/profile/profile-page/profile-page.component').then(m => m.ProfilePageComponent),
        canActivate: [authGuard]
    },
];