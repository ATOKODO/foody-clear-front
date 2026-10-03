import { TestBed } from '@angular/core/testing';
import { LocalizedDateAdapter } from './localized-date-adapter';

describe('LocalizedDateAdapter', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [LocalizedDateAdapter] }));

  it('preserves local calendar dates in both display languages', () => {
    const adapter = TestBed.inject(LocalizedDateAdapter);
    for (const locale of ['en-GB', 'fr-FR']) {
      adapter.setLocale(locale);
      const date = adapter.parse('2026-03-25')!;
      const roundTrip = adapter.parse(adapter.format(date, { year: 'numeric', month: 'numeric', day: 'numeric' }))!;
      expect(roundTrip.getFullYear()).toBe(2026);
      expect(roundTrip.getMonth()).toBe(2);
      expect(roundTrip.getDate()).toBe(25);
    }
  });

  it('parses ambiguous numeric input as day/month/year', () => {
    const date = TestBed.inject(LocalizedDateAdapter).parse('03/04/2026')!;
    expect(date.getMonth()).toBe(3);
    expect(date.getDate()).toBe(3);
  });

  it('rejects impossible dates instead of silently rolling them forward', () => {
    const adapter = TestBed.inject(LocalizedDateAdapter);
    for (const value of ['2026-02-31', '31/02/2026', '25/13/2026', '00/03/2026', 'not a date']) {
      expect(adapter.isValid(adapter.parse(value)!)).toBe(false);
    }
    expect(adapter.parse('')).toBeNull();
  });
});
