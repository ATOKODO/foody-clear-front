import { TestBed } from '@angular/core/testing';
import { PwaService } from './pwa-service';

describe('PwaService', () => {
  it('offers the native install prompt and consumes it only once', async () => {
    const service = TestBed.inject(PwaService);
    const prompt = jasmine.createSpy('prompt').and.resolveTo();
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt, userChoice: Promise.resolve({ outcome: 'accepted' }),
    });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBeTrue();
    expect(service.installAvailable()).toBeTrue();
    expect(await service.install()).toBeTrue();
    expect(service.installed()).toBeTrue();
    expect(await service.install()).toBeFalse();
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('handles a dismissed prompt without claiming the app is installed', async () => {
    const service = TestBed.inject(PwaService);
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), {
      prompt: () => Promise.resolve(), userChoice: Promise.resolve({ outcome: 'dismissed' }),
    }));
    expect(await service.install()).toBeFalse();
    expect(service.installed()).toBeFalse();
    expect(service.installing()).toBeFalse();
  });

  it('clears the pending prompt when the browser reports installation', () => {
    const service = TestBed.inject(PwaService);
    window.dispatchEvent(new Event('appinstalled'));
    expect(service.installed()).toBeTrue();
    expect(service.installAvailable()).toBeFalse();
  });
});
