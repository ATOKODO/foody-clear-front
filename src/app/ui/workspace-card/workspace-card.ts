import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'div[appWorkspaceCard], section[appWorkspaceCard]',
  imports: [],
  templateUrl: './workspace-card.html',
  styleUrl: './workspace-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-workspace-card' },
})
export class UiWorkspaceCard {}
