import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { AuthStore } from '../../../shared/stores/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {

  loading = false;
  errorMessage = '';
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authStore: AuthStore
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  isInvalid(field: string) {
    const c = this.form.get(field);
    return c?.invalid && c?.touched;
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.form.value;

    this.http.post<any>(`${environment.apiBaseUrl}/auth/login`, { email, password })
      .subscribe({
        next: (res) => {
          const user = {
            userId: res.userId,
            username: res.username,
            avatarUrl: res.avatarUrl,
            email: email ?? '',
            fullName: res.fullName ?? '',
            bio: '',
            status: 'ONLINE',
            isActive: true,
            lastSeenAt: new Date().toISOString()
          };
          this.authStore.setAuth(user, res.token);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Invalid email or password.';
          this.loading = false;
        }
      });
  }

  googleLogin() {
    window.location.href = `${environment.apiBaseUrl}/oauth2/authorization/google`;
  }
}