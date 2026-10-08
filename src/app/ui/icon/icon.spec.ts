import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiButton } from '../button/button';
import { UiIcon } from './icon';
import { IconDefinition, IconName, UI_ICONS, UI_ICON_NAMES } from './glyphs';

@Component({
  imports: [UiIcon, UiButton],
  template: `<button appButton aria-label="Edit entry" (click)="activated = true"><app-icon class="owner-icon" [name]="name()" [size]="size()" /></button>
    <app-icon [name]="name()" [label]="label()" />`,
})
class TestHost {
  readonly name = signal<IconName>('edit_note');
  readonly size = signal<'small' | 'medium' | 'large'>('medium');
  readonly label = signal('Calendar day');
  activated = false;
}

describe('UiIcon', () => {
  for (const name of UI_ICON_NAMES) {
    it(`renders the local ${name} glyph in the SVG namespace`, async () => {
      await TestBed.configureTestingModule({ imports: [UiIcon], providers: [provideZonelessChangeDetection()] }).compileComponents();
      const fixture = TestBed.createComponent(UiIcon);
      fixture.componentRef.setInput('name', name);
      await fixture.whenStable();
      const definition: IconDefinition = UI_ICONS[name];
      const svg: SVGSVGElement = fixture.nativeElement.querySelector('svg');
      expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
      expect(svg.getAttribute('data-icon')).toBe(name);
      expect(svg.getAttribute('fill')).toBe(definition.filled ? 'currentColor' : 'none');
      expect(svg.getAttribute('stroke')).toBe(definition.filled ? null : 'currentColor');
      expect(Array.from(svg.querySelectorAll('path')).map(path => path.getAttribute('d'))).toEqual([...definition.paths]);
      expect(svg.querySelectorAll('circle').length).toBe(definition.circle ? 1 : 0);
      expect(svg.getAttribute('focusable')).toBe('false');
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });
  }

  async function setup() {
    await TestBed.configureTestingModule({ imports: [TestHost], providers: [provideZonelessChangeDetection()] }).compileComponents();
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    return fixture;
  }

  it('keeps button icons decorative without replacing the control name or focus target', async () => {
    const fixture = await setup();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    const icon: HTMLElement = button.querySelector('app-icon')!;
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.hasAttribute('role')).toBeFalse();
    expect(icon.hasAttribute('tabindex')).toBeFalse();
    expect(button.getAttribute('aria-label')).toBe('Edit entry');
    button.focus();
    expect(document.activeElement).toBe(button);
    button.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.activated).toBeTrue();
  });

  it('exposes only explicitly named standalone images and removes empty names', async () => {
    const fixture = await setup();
    const icon: HTMLElement = fixture.nativeElement.querySelectorAll('app-icon')[1];
    expect(icon.getAttribute('role')).toBe('img');
    expect(icon.getAttribute('aria-label')).toBe('Calendar day');
    expect(icon.hasAttribute('aria-hidden')).toBeFalse();
    fixture.componentInstance.label.set('  ');
    await fixture.whenStable();
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.hasAttribute('aria-label')).toBeFalse();
    expect(icon.hasAttribute('role')).toBeFalse();
  });

  it('updates glyph and size without losing consumer classes or accumulating paths', async () => {
    const fixture = await setup();
    const icon: HTMLElement = fixture.nativeElement.querySelector('.owner-icon');
    fixture.componentInstance.name.set('sun');
    fixture.componentInstance.size.set('small');
    await fixture.whenStable();
    expect(icon.querySelectorAll('circle').length).toBe(1);
    expect(icon.querySelectorAll('path').length).toBe(UI_ICONS.sun.paths.length);
    expect(icon.classList.contains('app-ui-icon--small')).toBeTrue();
    fixture.componentInstance.name.set('today');
    fixture.componentInstance.size.set('large');
    await fixture.whenStable();
    expect(icon.querySelectorAll('circle').length).toBe(0);
    expect(icon.querySelectorAll('path').length).toBe(1);
    expect(icon.classList.contains('app-ui-icon--small')).toBeFalse();
    expect(icon.classList.contains('app-ui-icon--large')).toBeTrue();
    expect(icon.classList.contains('owner-icon')).toBeTrue();
  });
});
