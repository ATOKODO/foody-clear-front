import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate } from '@angular/service-worker';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly updates = inject(SwUpdate, { optional: true });
  private promptEvent: InstallPromptEvent | null = null;
  readonly installAvailable = signal(false);
  readonly installing = signal(false);
  readonly installed = signal(window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true);
  readonly online = signal(navigator.onLine);
  readonly updateAvailable = signal(false);

  constructor() {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      this.promptEvent = event as InstallPromptEvent;
      this.installAvailable.set(true);
    };
    const onInstalled = () => {
      this.installed.set(true);
      this.installAvailable.set(false);
      this.promptEvent = null;
    };
    const onConnection = () => this.online.set(navigator.onLine);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('online', onConnection);
    window.addEventListener('offline', onConnection);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('online', onConnection);
      window.removeEventListener('offline', onConnection);
    });
    if (this.updates?.isEnabled) {
      this.updates.versionUpdates.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
        if (event.type === 'VERSION_READY') this.updateAvailable.set(true);
      });
    }
  }

  async install(): Promise<boolean> {
    if (!this.promptEvent || this.installing()) return false;
    const prompt = this.promptEvent;
    this.promptEvent = null;
    this.installAvailable.set(false);
    this.installing.set(true);
    try {
      await prompt.prompt();
      const accepted = (await prompt.userChoice).outcome === 'accepted';
      if (accepted) this.installed.set(true);
      return accepted;
    } finally {
      this.installing.set(false);
    }
  }

  reload(): void {
    window.location.reload();
  }
}
