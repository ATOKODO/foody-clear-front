import { Component, input } from '@angular/core';

@Component({
  selector: 'app-master-detail-layout',
  standalone: true,
  templateUrl: './master-detail-layout.html',
  styleUrl: './master-detail-layout.scss',
})
export class MasterDetailLayout {
  readonly sideTitle = input.required<string>();
  readonly sideSubtitle = input<string | null>(null);
  readonly sideAriaLabel = input<string | null>(null);
  readonly detailAriaLabel = input<string | null>(null);
  readonly sideWidth = input('22rem');
}
