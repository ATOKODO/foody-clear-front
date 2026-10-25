import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiSelectableCard } from './selectable-card';

@Component({
  imports: [UiSelectableCard],
  template: `<div appSelectableCard class="owner-card" [active]="active()" (selectionRequested)="select()">
    <span selectable-card-content class="owner-title">{{ title() }}</span>
    <button selectable-card-actions class="owner-action" type="button">Edit</button>
  </div>`,
})
class TestHost {
  readonly active = signal(false);
  readonly title = signal('Fresh ingredients');
  selected = false;
  select(): void { this.selected = true; }
}

describe('UiSelectableCard', () => {
  async function setup() {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    return fixture;
  }

  it('preserves the native card, owner classes, selection button and separate secondary action', async () => {
    const fixture = await setup();
    const card: HTMLElement = fixture.nativeElement.querySelector('.owner-card');
    const select: HTMLButtonElement = card.querySelector('.app-selectable-card__control')!;
    const edit = card.querySelector<HTMLButtonElement>('.owner-action')!;
    expect(card.tagName).toBe('DIV');
    expect(card.classList.contains('app-selectable-card')).toBeTrue();
    expect(select.tagName).toBe('BUTTON');
    expect(select.closest('button')).toBe(select);
    expect(card.querySelectorAll('button').length).toBe(2);
    select.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.selected).toBeTrue();
    expect(edit.textContent?.trim()).toBe('Edit');
  });

  it('reflects owner selection changes without adding roles or focus targets to the surface', async () => {
    const fixture = await setup();
    const card: HTMLElement = fixture.nativeElement.querySelector('.owner-card');
    expect(card.classList.contains('app-selectable-card--active')).toBeFalse();
    fixture.componentInstance.active.set(true);
    await fixture.whenStable();
    expect(card.classList.contains('app-selectable-card--active')).toBeTrue();
    expect(card.getAttribute('role')).toBeNull();
    expect(card.getAttribute('tabindex')).toBeNull();
    expect(card.getAttribute('aria-pressed')).toBeNull();
    expect(card.querySelector('button')?.tabIndex).toBe(0);
  });

  it('keeps the owner-provided selection label current for long titles', async () => {
    const fixture = await setup();
    const select: HTMLButtonElement = (fixture.nativeElement as HTMLElement).querySelector('.app-selectable-card__control')!;
    fixture.componentInstance.title.set('Long term pantry, refrigerator and freezer inventory');
    await fixture.whenStable();
    expect(select.textContent).toContain('Long term pantry');
  });
});
