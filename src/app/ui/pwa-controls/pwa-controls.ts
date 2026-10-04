import { UiButton } from '../button/button';
import { TranslatePipe } from '../../i18n/translate-pipe';
import { Component, TemplateRef, inject, viewChild } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PwaService } from '../../../services/pwa-service';

@Component({
  selector: 'app-pwa-controls',
  imports: [UiButton, TranslatePipe, MatDialogModule],
  templateUrl: './pwa-controls.html',
  host: { style: 'display: block' },
})
export class PwaControls {
  readonly pwa = inject(PwaService);
  private readonly dialog = inject(MatDialog);
  private readonly instructions = viewChild<TemplateRef<unknown>>('instructions');

  async install(): Promise<void> {
    if (this.pwa.installAvailable()) {
      try {
        await this.pwa.install();
        return;
      } catch {
        // Browsers can reject a prompt; the manual installation guide remains available.
      }
    }
    const template = this.instructions();
    if (template) this.dialog.open(template, { width: 'min(480px, 94vw)', maxWidth: '94vw' });
  }
}
