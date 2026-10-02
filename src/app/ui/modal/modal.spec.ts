import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { UiModal } from './modal';

@Component({
  imports: [UiModal],
  template: `
    <button id="open" (click)="editor = true">Open</button>
    @if (editor) {
      <div appModal [appModalDisableClose]="saving()" (appModalClose)="editor = false">
        <button id="picker-open" (click)="picker = true">Choose</button>
        <input id="editor-input" />
      </div>
    }
    @if (picker) {
      <div appModal (appModalClose)="picker = false"><input id="picker-input" /></div>
    }
  `,
})
class ModalHarness {
  editor = false;
  picker = false;
  readonly saving = signal(false);
}

describe('UiModal', () => {
  let fixture: ComponentFixture<ModalHarness>;
  let root: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ModalHarness] }).compileComponents();
    fixture = TestBed.createComponent(ModalHarness);
    root = fixture.nativeElement;
    fixture.detectChanges();
  });

  async function open(id: string): Promise<void> {
    const button = root.querySelector<HTMLButtonElement>(id)!;
    button.focus();
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function escape(id: string): void {
    root.querySelector(id)!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  it('restores focus through nested dialogs and keeps the outer editor open', async () => {
    await open('#open');
    await open('#picker-open');
    expect(document.activeElement).toBe(root.querySelector('#picker-input'));
    escape('#picker-input');
    expect(fixture.componentInstance.picker).toBeFalse();
    expect(fixture.componentInstance.editor).toBeTrue();
    expect(document.activeElement).toBe(root.querySelector('#picker-open'));
    escape('#editor-input');
    expect(fixture.componentInstance.editor).toBeFalse();
    expect(document.activeElement).toBe(root.querySelector('#open'));
  });

  it('keeps the dialog open while saving, then allows Escape again', async () => {
    await open('#open');
    fixture.componentInstance.saving.set(true);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect((fixture.debugElement.query(By.directive(UiModal)).injector.get(UiModal)).appModalDisableClose()).toBeTrue();
    escape('#editor-input');
    expect(fixture.componentInstance.editor).toBeTrue();
    fixture.componentInstance.saving.set(false);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    escape('#editor-input');
    expect(fixture.componentInstance.editor).toBeFalse();
  });
});
