import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiMacroProgressCard } from './macro-progress-card';

@Component({
  imports: [UiMacroProgressCard],
  template: '<app-macro-progress-card [label]="label" [actual]="actual" [target]="target" [delta]="delta" [progress]="progress" [status]="status()" />',
})
class TestHost {
  label = 'Proteins';
  actual = '84 g';
  target = 'Target 90 g';
  delta = 'Delta -6 g';
  progress = 93;
  status = signal<'neutral' | 'under' | 'exact' | 'over'>('under');
}

describe('UiMacroProgressCard', () => {
  it('renders owner-formatted values, status and progress', async () => {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    const article: HTMLElement = fixture.nativeElement.querySelector('article.home-macro');
    expect(article.textContent).toContain('Proteins');
    expect(article.textContent).toContain('84 g');
    expect(article.textContent).toContain('Target 90 g');
    expect(article.textContent).toContain('Delta -6 g');
    expect(article.classList.contains('home-macro--under')).toBeTrue();
    expect((article.querySelector('.home-macro__fill') as HTMLElement).style.width).toBe('93%');
  });

  it('supports exact, over and neutral states', async () => {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    for (const status of ['exact', 'over', 'neutral'] as const) {
      fixture.componentInstance.status.set(status);
      await fixture.whenStable();
      const article: HTMLElement = fixture.nativeElement.querySelector('article.home-macro');
      expect(article.classList.contains(`home-macro--${status}`)).toBeTrue();
    }
  });
});
