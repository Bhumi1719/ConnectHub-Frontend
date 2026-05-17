import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../shared/stores/auth.store';

export const authGuard: CanActivateFn = () => {
    const authStore = inject(AuthStore);
    const router = inject(Router);

    if (authStore.token()) {
        return true;
    }
    return router.createUrlTree(['/login']);
};