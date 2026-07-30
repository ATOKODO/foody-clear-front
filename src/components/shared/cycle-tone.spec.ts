import { resolveCycleToneClass } from './cycle-tone';

describe('resolveCycleToneClass', () => {
  it('maps persisted cycle colors to design-system tone classes', () => {
    expect(resolveCycleToneClass('red')).toBe('app-tone--red');
    expect(resolveCycleToneClass(' YELLOW ')).toBe('app-tone--amber');
    expect(resolveCycleToneClass('purple')).toBe('app-tone--violet');
  });

  it('uses the neutral tone for unsupported or missing colors', () => {
    expect(resolveCycleToneClass('unknown')).toBe('app-tone--neutral');
    expect(resolveCycleToneClass(null)).toBe('app-tone--neutral');
  });
});
