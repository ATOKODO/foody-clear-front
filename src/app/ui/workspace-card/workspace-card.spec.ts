import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiWorkspaceCard } from './workspace-card';

@Component({
  imports: [UiWorkspaceCard],
  template: '<section appWorkspaceCard class="owner-layout"><h2>Current stock</h2><button type="button">Edit</button></section>',
})
class TestHost {}

describe('UiWorkspaceCard', () => {
  it('preserves the native host and owner-provided layout and content', async () => {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    const card: HTMLElement = fixture.nativeElement.querySelector('.owner-layout');
    expect(card.tagName).toBe('SECTION');
    expect(card.classList.contains('app-workspace-card')).toBeTrue();
    expect(card.querySelector('h2')?.textContent).toBe('Current stock');
    expect(card.querySelector('button')?.textContent).toBe('Edit');
  });
});
