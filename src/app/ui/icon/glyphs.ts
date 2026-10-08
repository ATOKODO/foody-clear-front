/** Local glyphs already used by the application; no runtime font or HTTP lookup. */
export interface IconDefinition {
  readonly paths: readonly string[];
  readonly filled?: boolean;
  readonly strokeWidth?: number;
  readonly circle?: { readonly cx: number; readonly cy: number; readonly r: number };
}

export const UI_ICONS = {
  menu: { paths: ['M4 7h16', 'M4 12h16', 'M4 17h16'], strokeWidth: 2 },
  sun: {
    paths: ['M12 2v2.5', 'M12 19.5V22', 'M4.93 4.93l1.77 1.77', 'M17.3 17.3l1.77 1.77', 'M2 12h2.5', 'M19.5 12H22', 'M4.93 19.07l1.77-1.77', 'M17.3 6.7l1.77-1.77'],
    circle: { cx: 12, cy: 12, r: 4 }, strokeWidth: 1.8,
  },
  moon: { paths: ['M21 12.79A9 9 0 1 1 11.21 3c0.2 0 0.4 0.01 0.59 0.03A7 7 0 0 0 21 12.79z'], strokeWidth: 1.8 },
  chevron_left: { paths: ['M15 19l-7-7 7-7'], strokeWidth: 2 },
  chevron_right: { paths: ['M9 5l7 7-7 7'], strokeWidth: 2 },
  arrow_right: { paths: ['M9 6l6 6-6 6'], strokeWidth: 1.8 },
  assignment: { paths: ['M7 7h10M7 12h10M7 17h6'], strokeWidth: 1.8 },
  day_entries: { paths: ['M6 7h12M6 12h12M6 17h8'], strokeWidth: 1.8 },
  external_meal: { paths: ['M12 3v18M7 8h10M7 13h10M7 18h10'], strokeWidth: 1.8 },
  today: { paths: ['M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z'], filled: true },
  autorenew: { paths: ['M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z'], filled: true },
  edit_note: { paths: ['M3,10h11v2H3V10z M3,8h11V6H3V8z M3,16h7v-2H3V16z M18.01,12.87l0.71-0.71c0.39-0.39,1.02-0.39,1.41,0l0.71,0.71 c0.39,0.39,0.39,1.02,0,1.41l-0.71,0.71L18.01,12.87z M17.3,13.58l-5.3,5.3V21h2.12l5.3-5.3L17.3,13.58z'], filled: true },
  add: { paths: ['M12 5v14M5 12h14'], strokeWidth: 1 },
} as const satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof UI_ICONS;
export const UI_ICON_NAMES = Object.keys(UI_ICONS) as IconName[];
