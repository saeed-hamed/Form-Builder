import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'fb-theme';

  isDark = signal(true);

  constructor() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved === 'light') {
      this.isDark.set(false);
      document.documentElement.classList.add('light-theme');
    }
  }

  toggle() {
    const next = !this.isDark();
    this.isDark.set(next);
    if (next) {
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem(this.STORAGE_KEY, 'dark');
    } else {
      document.documentElement.classList.add('light-theme');
      localStorage.setItem(this.STORAGE_KEY, 'light');
    }
  }
}
