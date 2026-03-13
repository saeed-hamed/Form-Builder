import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { ThemeService } from './services/theme.service';
import { DirectionService } from './services/direction.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslocoPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  theme = inject(ThemeService);
  dir = inject(DirectionService);
}
