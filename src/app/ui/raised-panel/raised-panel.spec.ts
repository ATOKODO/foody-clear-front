import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiRaisedPanel } from './raised-panel';

@Component({
  imports: [UiRaisedPanel],
  template: '<article appRaisedPanel class="home-panel"><h2>Today</h2><p>Owner-provided panel content.</p></article>',
})
class TestHost {}

describe('UiRaisedPanel', () => {
  it('preserves the semantic host and owner-provided content', async () => {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    const panel: HTMLElement = fixture.nativeElement.querySelector('.home-panel');
    expect(panel.tagName).toBe('ARTICLE');
    expect(panel.classList.contains('app-raised-panel')).toBeTrue();
    expect(panel.querySelector('h2')?.textContent).toBe('Today');
  });
});
