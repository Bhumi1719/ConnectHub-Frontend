import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <div *ngFor="let toast of toastService.toasts()"
        class="flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-sm
               pointer-events-auto min-w-64 max-w-sm animate-slide-up"
        [ngClass]="{
          'bg-emerald-900/90 border-emerald-500/30 text-emerald-100': toast.type === 'success',
          'bg-red-900/90 border-red-500/30 text-red-100': toast.type === 'error',
          'bg-slate-800/90 border-white/10 text-slate-100': toast.type === 'info'
        }">
        <!-- Icon -->
        <svg *ngIf="toast.type === 'success'" class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
        </svg>
        <svg *ngIf="toast.type === 'error'" class="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <svg *ngIf="toast.type === 'info'" class="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p class="text-sm flex-1">{{ toast.message }}</p>
        <button (click)="toastService.dismiss(toast.id)" class="text-current opacity-50 hover:opacity-100 transition-opacity shrink-0">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  `
})
export class ToastComponent {
    constructor(public toastService: ToastService) { }
}