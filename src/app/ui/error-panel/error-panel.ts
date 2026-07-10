import { Component, input } from '@angular/core';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-ui-error-panel',
  imports: [JsonPipe],
  template: `
    @if (error()) {
      <section class="app-alert app-alert--error" role="alert">
        <div class="app-alert__copy">
          <p class="app-alert__title">{{ title() }}</p>
          <p class="app-alert__message">{{ resolvedMessage }}</p>
        </div>
        @if (showDetails) {
          <details class="app-alert__details">
            <summary>{{ detailsLabel() }}</summary>
            <pre>{{ error() | json }}</pre>
          </details>
        }
      </section>
    }
    `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class UiErrorPanel {
  readonly error = input<unknown>(null);
  readonly title = input('Une erreur est survenue');
  readonly message = input<string | null>(null);
  readonly detailsLabel = input('View technical details');

  get resolvedMessage(): string {
    const explicitMessage = this.message()?.trim();
    if (explicitMessage) {
      return explicitMessage;
    }

    return summarizeError(this.error());
  }

  get showDetails(): boolean {
    return this.error() !== null && this.error() !== undefined;
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

  return findRecordMessage(record) ?? formatStatusMessage(record) ?? defaultErrorMessage;
}

function findRecordMessage(record: Record<string, unknown>): string | null {
  const direct = ['message', 'detail', 'error', 'title']
    .map((key) => readTextCandidate(record[key]))
    .find((candidate): candidate is string => !!candidate);
  if (direct) return direct;
  const nested = toRecord(record['error']);
  return nested
    ? ['message', 'detail'].map((key) => readTextCandidate(nested[key])).find((candidate): candidate is string => !!candidate) ?? null
    : null;
}

function formatStatusMessage(record: Record<string, unknown>): string | null {
  const status = typeof record['status'] === 'number' ? record['status'] : null;
  if (status === null) return null;
  const statusText = typeof record['statusText'] === 'string' ? record['statusText'].trim() : '';
  return statusText ? `La requete a echoue (${status} ${statusText}).` : `La requete a echoue (${status}).`;
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
