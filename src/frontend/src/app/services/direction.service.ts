import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class DirectionService {
  private readonly STORAGE_KEY = 'fb-lang';
  private transloco = inject(TranslocoService);

  isRtl = signal(false);

  constructor() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved === 'ar') {
      this.isRtl.set(true);
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    }
  }

  toggle() {
    const next = !this.isRtl();
    this.isRtl.set(next);
    const lang = next ? 'ar' : 'en';
    document.documentElement.setAttribute('dir', next ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem(this.STORAGE_KEY, lang);
    this.transloco.setActiveLang(lang);
  }
}
