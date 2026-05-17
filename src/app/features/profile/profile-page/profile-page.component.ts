import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '../../../shared/stores/auth.store';
import { ProfileService } from '../../../core/api/profile.service';
import { MediaService } from '../../../core/api/media.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { PresenceService } from '../../../core/services/presence.service';

type StatusOption = { value: string; label: string; color: string };

@Component({
    selector: 'app-profile-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './profile-page.component.html'
})
export class ProfilePageComponent implements OnInit {

    profileForm!: FormGroup;
    passwordForm!: FormGroup;

    savingProfile = false;
    savingPassword = false;
    uploadingAvatar = signal(false);
    avatarProgress = signal(0);

    statusOptions: StatusOption[] = [
        { value: 'ONLINE', label: 'Online', color: 'bg-emerald-400' },
        { value: 'AWAY', label: 'Away', color: 'bg-amber-400' },
        { value: 'DND', label: 'Do Not Disturb', color: 'bg-red-400' },
        { value: 'INVISIBLE', label: 'Invisible', color: 'bg-slate-500' }
    ];

    constructor(
        private fb: FormBuilder,
        public authStore: AuthStore,
        private profileService: ProfileService,
        private mediaService: MediaService,
        private toastService: ToastService,
        public presenceService: PresenceService,
        private router: Router
    ) { }

    ngOnInit() {
        const user = this.authStore.currentUser();

        this.profileForm = this.fb.group({
            fullName: [user?.fullName || '', Validators.required],
            username: [user?.username || '', Validators.required],
            bio: [user?.bio || '']
        });

        this.passwordForm = this.fb.group({
            currentPassword: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    private passwordMatchValidator(g: any) {
        const np = g.get('newPassword')?.value;
        const cp = g.get('confirmPassword')?.value;
        return np === cp ? null : { passwordMismatch: true };
    }

    onAvatarSelected(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const sizeMb = file.size / (1024 * 1024);
        if (sizeMb > 5) {
            this.toastService.show('Avatar must be under 5MB.', 'error');
            return;
        }

        this.uploadingAvatar.set(true);
        this.avatarProgress.set(0);

        this.mediaService.uploadImage(file, this.authStore.currentUser()!.userId).subscribe({
            next: ({ progress, response }) => {
                this.avatarProgress.set(progress);
                if (response) {
                    this.uploadingAvatar.set(false);
                    const userId = this.authStore.currentUser()!.userId;
                    const user = this.authStore.currentUser()!;

                    this.profileService.updateProfile(userId, {
                        fullName: user.fullName,
                        username: user.username,
                        bio: user.bio,
                        avatarUrl: response.url
                    }).subscribe({
                        next: (updated) => {
                            this.authStore.setAuth(updated, this.authStore.token()!);
                            this.toastService.show('Avatar updated.', 'success');
                        }
                    });
                }
            },
            error: () => {
                this.uploadingAvatar.set(false);
                this.toastService.show('Avatar upload failed.', 'error');
            }
        });
    }

    saveProfile() {
        if (this.profileForm.invalid) return;
        this.savingProfile = true;

        const userId = this.authStore.currentUser()!.userId;
        const { fullName, username, bio } = this.profileForm.value;

        this.profileService.updateProfile(userId, {
            fullName,
            username,
            bio,
            avatarUrl: this.authStore.currentUser()?.avatarUrl
        }).subscribe({
            next: (updated) => {
                this.authStore.setAuth(updated, this.authStore.token()!);
                this.toastService.show('Profile saved.', 'success');
                this.savingProfile = false;
            },
            error: (err) => {
                this.toastService.show(err.error?.message || 'Failed to save profile.', 'error');
                this.savingProfile = false;
            }
        });
    }

    changePassword() {
        if (this.passwordForm.invalid) return;
        this.savingPassword = true;

        const userId = this.authStore.currentUser()!.userId;
        const { currentPassword, newPassword } = this.passwordForm.value;

        this.profileService.changePassword(userId, { currentPassword, newPassword }).subscribe({
            next: () => {
                this.toastService.show('Password changed successfully.', 'success');
                this.passwordForm.reset();
                this.savingPassword = false;
            },
            error: (err) => {
                this.toastService.show(err.error?.message || 'Failed to change password.', 'error');
                this.savingPassword = false;
            }
        });
    }

    setStatus(status: string) {
        const userId = this.authStore.currentUser()?.userId;
        if (!userId) return;

        this.profileService.updateStatus(userId, status).subscribe({
            next: () => {
                this.presenceService.updatePresence({ userId, status: status as any });
                this.toastService.show(`Status set to ${status.toLowerCase()}.`, 'info');
            },
            error: () => this.toastService.show('Failed to update status.', 'error')
        });
    }

    isInvalid(form: FormGroup, field: string) {
        const c = form.get(field);
        return c?.invalid && c?.touched;
    }

    getInitial(name: any) {
        return String(name ?? '').charAt(0).toUpperCase() || '?';
    }

    goBack() { this.router.navigate(['/chat']); }
}