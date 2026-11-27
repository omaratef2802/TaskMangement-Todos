import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from './core/api.service';

@Component({
  standalone: true,
  selector: 'app-setup-admin',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="setup-page">
      <section class="setup-card">
        <a class="brand"><span class="brand-mark"><i class="bi bi-check2"></i></span> TaskFlow</a>
        <span class="eyebrow">INITIAL WORKSPACE SETUP</span>
        <h1>Create the first administrator</h1>
        <p class="muted">This one-time setup is available only while the workspace has no administrator.</p>
        @if (error()) { <div class="alert-error">{{ error() }}</div> }
        @if (created()) {
          <div class="alert-success">Administrator account created. You can now sign in.</div>
          <button class="btn-primary wide" type="button" (click)="goToLogin()">Go to sign in</button>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="form-row">
              <div><label>First name</label><input formControlName="fname" placeholder="First name"></div>
              <div><label>Last name</label><input formControlName="lname" placeholder="Last name"></div>
            </div>
            <label>Username</label><input formControlName="username" placeholder="Choose a username">
            <label>Email address</label><input type="email" formControlName="mail" placeholder="admin@example.com">
            <label>Password</label><input type="password" formControlName="password" placeholder="At least 8 characters">
            <button class="btn-primary wide" type="submit" [disabled]="busy() || form.invalid">
              {{ busy() ? 'Creating administrator…' : 'Create first administrator' }}
            </button>
          </form>
          <p class="setup-note">After this account is created, first-time setup is permanently closed.</p>
        }
      </section>
    </main>
  `,
  styles: [`
    .setup-page{min-height:100vh;display:grid;place-items:center;padding:32px 18px;background:var(--page-bg,#f7f7f2)}
    .setup-card{width:min(100%,520px);padding:clamp(24px,5vw,44px);background:var(--surface,#fff);border:1px solid var(--border,#e6e9e3);border-radius:24px;box-shadow:0 20px 60px rgba(30,50,40,.08)}
    .setup-card .brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:20px;margin-bottom:34px;color:var(--text,#20352e);text-decoration:none}
    .setup-card h1{font-size:clamp(26px,4vw,34px);margin:10px 0}
    .setup-card form{display:grid;gap:12px;margin-top:26px}
    .setup-card label{font-weight:650;font-size:13px}
    .setup-card input{width:100%;padding:13px 14px;border:1px solid var(--border,#e1e6df);border-radius:12px;background:var(--surface,#fff);color:var(--text,#20352e)}
    .setup-card .form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .setup-card .form-row>div{display:grid;gap:8px}
    .setup-card form>label{margin-top:4px}
    .setup-card .btn-primary{margin-top:12px}
    .setup-note{font-size:12px;color:var(--muted,#718078);margin:18px 0 0;text-align:center}
    @media(max-width:480px){.setup-card .form-row{grid-template-columns:1fr}}
  `]
})
export class SetupAdminComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly busy = signal(false);
  readonly created = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    fname: ['', [Validators.required, Validators.minLength(3)]],
    lname: ['', [Validators.required, Validators.minLength(3)]],
    username: ['', [Validators.required, Validators.minLength(5)]],
    mail: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  submit(): void {
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.api.setupFirstAdmin(this.form.getRawValue()).subscribe({
      next: () => {
        this.created.set(true);
        this.busy.set(false);
        this.form.disable();
      },
      error: (e) => {
        this.error.set(e.error?.message || 'Could not create the first administrator.');
        this.busy.set(false);
      }
    });
  }

  goToLogin(): void {
    this.router.navigateByUrl('/login');
  }
}
