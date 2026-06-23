import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_NAVIGATION, APP_NAVIGATION_ENTRIES } from '../../app/app.navigation';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './home.scss',
})
export class Home {
  readonly featuredEntries = APP_NAVIGATION_ENTRIES
    .filter(({ entry }) => entry.featured && entry.id !== 'home')
    .map(({ group, entry }) => ({
      ...entry,
      groupLabel: group.label,
    }));

  readonly dashboardGroups = APP_NAVIGATION.filter((group) => group.id !== 'home');
}
