import { UiDisclosure } from '../disclosure/disclosure';
import { UiDisclosureSummary } from '../disclosure-summary/disclosure-summary';
import { Component, inject, input } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { TranslatePipe } from '../../i18n/translate-pipe';
import { Language } from '../../i18n/language';
import { UiAlert } from '../alert/alert';
import { UiCodePanel } from '../code-panel/code-panel';

@Component({
  selector: 'app-ui-error-panel',
  imports: [UiDisclosure, UiDisclosureSummary, UiAlert, UiCodePanel, JsonPipe, TranslatePipe],
  template: `
    @if (error()) {
      <section appAlert tone="error" role="alert">
        <div class="app-alert__copy">
          <p class="app-alert__title">{{ title() | translate }}</p>
          <p class="app-alert__message">{{ displayMessage | translate }}</p>
        </div>
        @if (showDetails) {
          <details appDisclosure class="app-alert__details">
            <summary appDisclosureSummary emphasis="strong">{{ detailsLabel() | translate }}</summary>
            <pre appCodePanel wrap>{{ error() | json }}</pre>
          </details>
        }
      </section>
    }
    `,
  host: { style: 'display: block' },
})
export class UiErrorPanel {
  private readonly language = inject(Language);
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

  get displayMessage(): string {
    const message = this.resolvedMessage;
    if (this.message() || this.language.hasTranslation(message)) return message;
    // Unrecognized server diagnostics remain available verbatim in technical details.
    const status = toRecord(this.error())?.['status'];
    if (status === 0) return 'Unable to reach the server. Check your connection and try again.';
    if (status === 400 || status === 422) return 'Some values are invalid. Check the form and try again.';
    if (status === 404) return 'The requested resource was not found.';
    if (status === 409) return 'This action conflicts with the current data. Refresh and try again.';
    return defaultErrorMessage;
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

  const record = toRecord(error);
  if (!record) {
    return defaultErrorMessage;
  }

  return findRecordMessage(record) ?? formatStatusMessage(record) ?? defaultErrorMessage;
}

function findRecordMessage(record: Record<string, unknown>): string | null {
  const responseMessage = readTextCandidate(record['error']);
  if (responseMessage) return responseMessage;
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

function readTextCandidate(value: unknown, depth = 0): string | null {
  if (depth > 5) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  if (Array.isArray(value)) {
    const messages = value
      .map((entry) => readTextCandidate(entry, depth + 1))
      .filter((entry): entry is string => !!entry);
    return messages.length ? messages.join('\n') : null;
  }

  if (value && typeof value === 'object') {
    const nested = toRecord(value);
    if (!nested) {
      return null;
    }

    return readTextCandidate(nested['message'] ?? nested['detail'] ?? nested['error'] ?? null, depth + 1);
  }

  return null;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

const defaultErrorMessage =
  'La requete a echoue. Verifie la connexion au backend et les parametres envoyes.';
