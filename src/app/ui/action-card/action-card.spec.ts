import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiActionCard } from './action-card';

@Component({
  imports: [UiActionCard],
  template: '<app-action-card icon="assignment" [label]="label" [title]="title" [description]="description" [tone]="tone" [disabled]="disabled()" (activated)="activate()" />',
})
class TestHost {
  label = 'Cycle';
  title = 'Manage cycle';
  description = 'Update the active assignment for this day.';
  tone: 'accent' | 'info' | 'neutral' = 'accent';
  readonly disabled = signal(false);
  readonly activations = signal(0);

  activate(): void {
    this.activations.update(count => count + 1);
  }
}

describe('UiActionCard', () => {
  it('renders localized content, decorative icons and tone on a native button', async () => {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.type).toBe('button');
    expect(button.textContent).toContain('Cycle');
    expect(button.textContent).toContain('Manage cycle');
    expect(button.textContent).toContain('Update the active assignment for this day.');
    expect(button.querySelector('[data-icon="assignment"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(button.classList.contains('planning-action-card--accent')).toBeTrue();
  });

  it('emits activation and keeps disabled cards inactive', async () => {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.activations()).toBe(1);

    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();
    button.click();
    await fixture.whenStable();
    expect(button.disabled).toBeTrue();
    expect(fixture.componentInstance.activations()).toBe(1);
  });
});
