import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Tag } from './tag';
import { TagService } from '../../services/tag-service';

describe('Tag', () => {
  let component: Tag;
  let fixture: ComponentFixture<Tag>;
  const tagServiceMock = {
    baseUrl: 'http://localhost:3000',
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    findAll: jasmine.createSpy('findAll').and.returnValue(of([])),
    create: jasmine.createSpy('create').and.returnValue(of({ id: 1, name: 'Bio' })),
    update: jasmine.createSpy('update').and.returnValue(of({ id: 1, name: 'Bio' })),
    remove: jasmine.createSpy('remove').and.returnValue(of(void 0)),
  };

  beforeEach(async () => {
    tagServiceMock.setBaseUrl.calls.reset();
    tagServiceMock.findAll.calls.reset();
    tagServiceMock.create.calls.reset();
    tagServiceMock.update.calls.reset();
    tagServiceMock.remove.calls.reset();

    await TestBed.configureTestingModule({
      imports: [Tag],
      providers: [{ provide: TagService, useValue: tagServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Tag);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit dataChanged after creating a tag', () => {
    const emitSpy = spyOn(component.dataChanged, 'emit');

    component.onFormSubmitted({
      mode: 'add',
      value: {
        name: 'Bio',
      },
    });

    expect(emitSpy).toHaveBeenCalled();
  });

  it('should render without standalone chrome when embedded', () => {
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(nativeElement.querySelector('section.app-page')).toBeNull();
    expect(nativeElement.querySelector('[data-testid="tag-embedded"]')).not.toBeNull();
    expect(nativeElement.querySelector('[data-testid="tag-list-embedded"]')).not.toBeNull();
  });

  it('should cover tag response shapes and CRUD state transitions', () => {
    const callPrivate = privateMethod(component);
    const tags = [{ id: 2, name: 'Fresh' }, { id: 'bad', name: 'Ignored' }];
    component.tags = tags as never;

    expect(component.tagListItems).toEqual([
      { id: '2', name: 'Fresh' },
      { id: 'bad', name: 'Ignored' },
    ]);
    expect(callPrivate('extractTagsFromResponse', tags)).toEqual([tags[0]]);
    expect(callPrivate('extractTagsFromResponse', tags[0])).toEqual([tags[0]]);
    expect(callPrivate('extractTagsFromResponse', { payload: [tags[0]] })).toEqual([tags[0]]);
    expect(callPrivate('extractTagsFromResponse', { data: [{ id: 'bad' }] })).toEqual([]);
    expect(callPrivate('extractTagsFromResponse', null)).toEqual([]);
    expect(callPrivate('isTagLike', tags[0])).toBeTrue();
    expect(callPrivate('isTagLike', { id: 1 })).toBeFalse();
    expect(callPrivate('toCreateDto', { name: ' Fresh ' })).toEqual({ name: 'Fresh' });
    expect(callPrivate('toUpdateDto', { name: ' Updated ' })).toEqual({ name: 'Updated' });
    expect(callPrivate('toFormValue', tags[0])).toEqual({ name: 'Fresh' });

    component.onEditRequested({ id: '2', name: 'Fresh' });
    expect(component.formMode).toBe('edit');
    expect(component.editingTagId).toBe(2);
    component.onCancelForm();
    component.onFormSubmitted({ mode: 'add', value: { name: ' New ' } });
    expect(tagServiceMock.create).toHaveBeenCalledWith({ name: 'New' });
    component.editingTagId = 2;
    component.onFormSubmitted({ mode: 'edit', value: { name: ' Updated ' } });
    expect(tagServiceMock.update).toHaveBeenCalledWith(2, { name: 'Updated' });
    component.onDeleteRequested({ id: '2', name: 'Fresh' });
    expect(tagServiceMock.remove).toHaveBeenCalledWith(2);

    tagServiceMock.findAll.and.returnValue(throwError(() => new Error('load failed')));
    component.onRefreshRequested();
    expect(component.lastError).toEqual(jasmine.any(Error));
    tagServiceMock.findAll.and.returnValue(of([]));
    tagServiceMock.remove.and.returnValue(throwError(() => new Error('delete failed')));
    component.onDeleteRequested({ id: '2', name: 'Fresh' });
    expect(component.lastError).toEqual(jasmine.any(Error));
    component.onMenuClicked();
    expect(component.lastResponse).toEqual(jasmine.objectContaining({ info: jasmine.any(String) }));
  });
});

function privateMethod(
  component: Tag,
): (name: string, ...args: unknown[]) => unknown {
  const methods = component as unknown as Record<string, (...args: unknown[]) => unknown>;
  return (name, ...args) => methods[name](...args);
}
