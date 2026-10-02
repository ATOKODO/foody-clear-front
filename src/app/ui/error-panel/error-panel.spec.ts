import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';

import { UiErrorPanel } from './error-panel';

describe('UiErrorPanel', () => {
  let fixture: ComponentFixture<UiErrorPanel>;
  let component: UiErrorPanel;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UiErrorPanel] }).compileComponents();
    fixture = TestBed.createComponent(UiErrorPanel);
    component = fixture.componentInstance;
  });

  it('should render string and explicit error messages', () => {
    fixture.componentRef.setInput('error', '  Something failed  ');
    fixture.detectChanges();
    expect(component.resolvedMessage).toBe('Something failed');
    expect(component.showDetails).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Something failed');

    fixture.componentRef.setInput('message', ' Custom message ');
    fixture.detectChanges();
    expect(component.resolvedMessage).toBe('Custom message');
  });

  it('shows the business response and all validation messages before the HTTP wrapper', () => {
    fixture.componentRef.setInput('error', new HttpErrorResponse({
      status: 400, url: '/inventory/4/products',
      error: { message: ['Insufficient stock', 'Quantity must be positive'] },
    }));
    fixture.detectChanges();
    expect(component.resolvedMessage).toBe('Insufficient stock\nQuantity must be positive');

    fixture.componentRef.setInput('error', new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') }));
    fixture.detectChanges();
    expect(component.resolvedMessage).toContain('Http failure response');
  });

  it('should summarize error objects, nested details, status and fallback values', () => {
    fixture.componentRef.setInput('error', new Error('Backend failed'));
    fixture.detectChanges();
    expect(component.resolvedMessage).toBe('Backend failed');
    fixture.componentRef.setInput('error', { error: { detail: 'Nested detail' } });
    fixture.detectChanges();
    expect(component.resolvedMessage).toBe('Nested detail');
    fixture.componentRef.setInput('error', { message: ['', 'Array detail'] });
    fixture.detectChanges();
    expect(component.resolvedMessage).toBe('Array detail');
    fixture.componentRef.setInput('error', { status: 404, statusText: 'Not found' });
    fixture.detectChanges();
    expect(component.resolvedMessage).toContain('404 Not found');
    fixture.componentRef.setInput('error', { status: 500 });
    fixture.detectChanges();
    expect(component.resolvedMessage).toContain('500');
    fixture.componentRef.setInput('error', 42);
    fixture.detectChanges();
    expect(component.resolvedMessage).toContain('requete');
    fixture.componentRef.setInput('error', ' ');
    fixture.detectChanges();
    expect(component.resolvedMessage).toContain('requete');
    fixture.componentRef.setInput('error', null);
    fixture.detectChanges();
    expect(component.showDetails).toBeFalse();
  });
});
