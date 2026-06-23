
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_NAVIGATION, APP_NAVIGATION_ENTRIES } from '../../app/app.navigation';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
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
