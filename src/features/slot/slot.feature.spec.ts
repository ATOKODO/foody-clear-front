import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import type {
  SlotFormMode,
  SlotFormValue,
} from '../../components/slot/slot-form/slot-form';
import type { SlotListItem } from '../../components/slot/slot-list/slot-list';
import { SlotFeature } from './slot.feature';
import { SlotFeatureStore } from './slot.store';

describe('SlotFeature', () => {
  let component: SlotFeature;
  let fixture: ComponentFixture<SlotFeature>;
  let store: ReturnType<typeof createStoreMock>;

  beforeEach(async () => {
    store = createStoreMock();
    await TestBed.configureTestingModule({
      imports: [SlotFeature],
    })
      .overrideComponent(SlotFeature, {
        set: {
          providers: [{ provide: SlotFeatureStore, useValue: store }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SlotFeature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('refreshes the store and exposes its state', () => {
    expect(store.refresh).toHaveBeenCalled();
    expect(component.loading).toBeTrue();
    expect(component.saving).toBeFalse();
    expect(component.loadingMeta).toBeTrue();
  });

  it('delegates feature actions and emits data changes', () => {
    const item = { id: '1', title: 'Breakfast' } as SlotListItem;
    const value = {
      key: 'breakfast',
      title: 'Breakfast',
      sortOrder: 1,
      startTime: null,
      endTime: null,
      nutritionValues: [],
    } satisfies SlotFormValue;
    const dataChanged = jasmine.createSpy('dataChanged');
    component.dataChanged.subscribe(dataChanged);

    component.refresh();
    component.onAddRequested();
    component.openCreate();
    component.onEditRequested(item);
    component.onDeleteRequested(item);
    component.onFormSubmitted({ mode: 'add' as SlotFormMode, value },);
    component.onMenuClicked();
    component.onCancelForm();

    expect(store.refresh).toHaveBeenCalledTimes(2);
    expect(store.onAddRequested).toHaveBeenCalledTimes(2);
    expect(store.onEditRequested).toHaveBeenCalledWith(item);
    expect(store.onDeleteRequested).toHaveBeenCalledWith(
      item,
      jasmine.any(Function),
    );
    expect(store.onFormSubmitted).toHaveBeenCalledWith(
      { mode: 'add', value },
      jasmine.any(Function),
    );
    expect(store.onMenuClicked).toHaveBeenCalled();
    expect(store.onCancelForm).toHaveBeenCalled();

    const deleteCallback = store.onDeleteRequested.calls.mostRecent().args[1];
    const submitCallback = store.onFormSubmitted.calls.mostRecent().args[1];
    deleteCallback();
    submitCallback();
    expect(dataChanged).toHaveBeenCalledTimes(2);
  });

  it('updates the embedded dialog offset when the form is visible', () => {
    fixture.componentRef.setInput('embedded', true);
    store.formVisible.set(true);
    fixture.detectChanges();

    const requestAnimationFrame = spyOn(
      window,
      'requestAnimationFrame',
    ).and.returnValue(1);
    const header = document.createElement('header');
    header.className = 'app-shell__header';
    spyOn(header, 'getBoundingClientRect').and.returnValue({
      bottom: 37,
    } as DOMRect);
    document.body.appendChild(header);

    component.onWindowResize();
    expect(requestAnimationFrame).toHaveBeenCalled();
    expect(component.embeddedDialogTopOffset()).toBe(0);
    // Run this frame after scheduling, as the browser does.
    requestAnimationFrame.calls.mostRecent().args[0](0);
    expect(component.embeddedDialogTopOffset()).toBe(37);

    header.remove();
  });

  it('skips layout synchronization when the store does not open the form', () => {
    fixture.componentRef.setInput('embedded', true);
    store.formVisible.set(true);
    store.onAddRequested.and.returnValue(false);
    store.onEditRequested.and.returnValue(false);
    fixture.detectChanges();

    const requestAnimationFrame = spyOn(window, 'requestAnimationFrame');
    component.onAddRequested();
    component.onEditRequested({ id: '1', title: 'Breakfast' });
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
});

function createStoreMock() {
  return {
    loading: true,
    saving: false,
    loadingMeta: true,
    lastError: null,
    lastMetaError: null,
    formMode: 'add' as SlotFormMode,
    formInitialValue: null,
    nutritionKeys: [],
    formVisible: signal(false),
    slotListItems: signal<SlotListItem[]>([]),
    refresh: jasmine.createSpy('refresh'),
    onAddRequested: jasmine.createSpy('onAddRequested').and.returnValue(true),
    onEditRequested: jasmine.createSpy('onEditRequested').and.returnValue(true),
    onDeleteRequested: jasmine.createSpy('onDeleteRequested'),
    onFormSubmitted: jasmine.createSpy('onFormSubmitted'),
    onMenuClicked: jasmine.createSpy('onMenuClicked'),
    onCancelForm: jasmine.createSpy('onCancelForm'),
  };
}
