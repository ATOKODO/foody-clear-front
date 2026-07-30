const CYCLE_TONE_CLASS_BY_COLOR: Readonly<Record<string, string>> = {
  red: 'app-tone--red',
  blue: 'app-tone--blue',
  green: 'app-tone--green',
  yellow: 'app-tone--amber',
  orange: 'app-tone--orange',
  purple: 'app-tone--violet',
  pink: 'app-tone--pink',
};

export function resolveCycleToneClass(color: string | null | undefined): string {
  const normalized = color?.trim().toLowerCase() ?? '';
  return CYCLE_TONE_CLASS_BY_COLOR[normalized] ?? 'app-tone--neutral';
}
