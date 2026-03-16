import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-ui-error-panel',
  imports: [CommonModule, JsonPipe],
  template: `
    <section *ngIf="error" class="app-alert app-alert--error" role="alert">
      <div class="app-alert__copy">
        <p class="app-alert__title">{{ title }}</p>
        <p class="app-alert__message">{{ resolvedMessage }}</p>
      </div>

      <details class="app-alert__details" *ngIf="showDetails">
        <summary>{{ detailsLabel }}</summary>
        <pre>{{ error | json }}</pre>
      </details>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiErrorPanel {
  @Input() error: unknown = null;
  @Input() title = 'Une erreur est survenue';
  @Input() message: string | null = null;
  @Input() detailsLabel = 'Voir les details techniques';

  get resolvedMessage(): string {
    const explicitMessage = this.message?.trim();
    if (explicitMessage) {
      return explicitMessage;
    }

    return summarizeError(this.error);
  }

  get showDetails(): boolean {
    return this.error !== null && this.error !== undefined;
  }
}

function summarizeError(error: unknown): string {
  if (typeof error === 'string') {
    const trimmed = error.trim();
    return trimmed || defaultErrorMessage;
  }

  if (error instanceof Error) {
    const message = error.message.trim();
    return message || defaultErrorMessage;
  }

  const record = toRecord(error);
  if (!record) {
    return defaultErrorMessage;
  }

  for (const key of ['message', 'detail', 'error', 'title']) {
    const value = record[key];
    const candidate = readTextCandidate(value);
    if (candidate) {
      return candidate;
    }
  }

  const nestedError = toRecord(record['error']);
  if (nestedError) {
    for (const key of ['message', 'detail']) {
      const candidate = readTextCandidate(nestedError[key]);
      if (candidate) {
        return candidate;
      }
    }
  }

  const status = typeof record['status'] === 'number' ? record['status'] : null;
  const statusText =
    typeof record['statusText'] === 'string' && record['statusText'].trim() !== ''
      ? record['statusText'].trim()
      : null;

  if (status !== null) {
    return statusText
      ? `La requete a echoue (${status} ${statusText}).`
      : `La requete a echoue (${status}).`;
  }

  return defaultErrorMessage;
}

function readTextCandidate(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  if (Array.isArray(value)) {
    const firstText = value
      .map((entry) => readTextCandidate(entry))
      .find((entry): entry is string => !!entry);
    return firstText ?? null;
  }

  if (value && typeof value === 'object') {
    const nested = toRecord(value);
    if (!nested) {
      return null;
    }

    return readTextCandidate(nested['message'] ?? nested['detail'] ?? null);
  }

  return null;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

const defaultErrorMessage =
  'La requete a echoue. Verifie la connexion au backend et les parametres envoyes.';
