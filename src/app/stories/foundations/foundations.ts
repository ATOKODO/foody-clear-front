import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import tokenSource from '../../../styles/_tokens.scss?raw';

@Component({
  selector: 'app-foundations',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatCardModule],
  templateUrl: './foundations.html',
  styleUrl: './foundations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Foundations {
  readonly section = input<'tokens' | 'typography' | 'layout' | 'primitives' | 'icons'>('tokens');
  readonly tokens = [...new Set(tokenSource.match(/--app-[\w-]+(?=\s*:)/g) ?? [])];
  readonly breakpoints = tokenSource.match(/\$breakpoints:\s*\(([\s\S]*?)\);/)?.[1]?.trim() ?? '';
  value(token: string): string { return getComputedStyle(document.documentElement).getPropertyValue(token).trim(); }
}
