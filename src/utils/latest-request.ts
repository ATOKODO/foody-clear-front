import type { DestroyRef } from '@angular/core';
import type { Observable, Observer, Subscription } from 'rxjs';

/** A view owns one request at a time; replacing or closing it cancels its response. */
export class LatestRequest {
  private subscription: Subscription | null = null;

  constructor(destroyRef: DestroyRef) {
    destroyRef.onDestroy(() => this.cancel());
  }

  subscribe<T>(source: Observable<T>, observer: Partial<Observer<T>>): void {
    this.cancel();
    this.subscription = source.subscribe(observer);
  }

  cancel(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }
}
