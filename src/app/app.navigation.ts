export interface AppNavigationEntry {
  id: string;
  path: string;
  label: string;
  shortLabel: string;
  description: string;
  featured?: boolean;
}

export interface AppNavigationGroup {
  id: string;
  label: string;
  description: string;
  entries: AppNavigationEntry[];
}

export const APP_NAVIGATION: AppNavigationGroup[] = [
  {
    id: 'home',
    label: 'Home',
    description: "Overview and shortcuts",
    entries: [
      {
        id: 'home',
        path: '/home',
        label: 'Home',
        shortLabel: 'AC',
        description: "Dashboard, workflows and entry points",
        featured: true,
      },
    ],
  },
  {
    id: 'catalog',
    label: 'Catalog',
    description: 'Products, structure and metadata',
    entries: [
      {
        id: 'product',
        path: '/product',
        label: 'Catalog',
        shortLabel: 'CA',
        description: 'Products, categories, tags and generic products',
        featured: true,
      },
      {
        id: 'category',
        path: '/category',
        label: 'Categories',
        shortLabel: 'CT',
        description: 'Organization, alerts and minimum thresholds',
      },
      {
        id: 'generic-product',
        path: '/generic-product',
        label: 'Generic products',
        shortLabel: 'PG',
        description: 'Stock reference and conversions',
      },
      {
        id: 'tag',
        path: '/tag',
        label: 'Tags',
        shortLabel: 'TG',
        description: 'Taxonomy and cross-cutting filters',
      },
    ],
  },
  {
    id: 'operations',
    label: 'Stock',
    description: 'Stock and purchasing',
    entries: [
      {
        id: 'shopping-list',
        path: '/shopping-list',
        label: 'Shopping lists',
        shortLabel: 'LC',
        description: "Purchase prep, checklists and stock conversion",
        featured: true,
      },
      {
        id: 'inventory',
        path: '/inventory',
        label: 'Inventories',
        shortLabel: 'IN',
        description: "Stock, quantities and add movements",
        featured: true,
      },
      {
        id: 'meal-prep',
        path: '/meal-prep',
        label: 'Meal prep',
        shortLabel: 'PR',
        description: 'Dishes, reusable meals and shopping generation',
        featured: true,
      },
    ],
  },
  {
    id: 'planning',
    label: 'Planning',
    description: 'Cycles, templates and calendar',
    entries: [
      {
        id: 'template',
        path: '/template',
        label: 'Templates',
        shortLabel: 'TP',
        description: 'Planned days and stock verification',
        featured: true,
      },
      {
        id: 'cycle',
        path: '/cycle',
        label: 'Cycles',
        shortLabel: 'CY',
        description: 'Cycle hub, day sets and time slots',
        featured: true,
      },
      {
        id: 'day-set',
        path: '/day-set',
        label: 'Day sets',
        shortLabel: 'DS',
        description: 'Template days and nutrition targets',
      },
      {
        id: 'slot',
        path: '/slot',
        label: 'Time slots',
        shortLabel: 'SL',
        description: 'Meal windows and slot targets',
      },
      {
        id: 'planning',
        path: '/planning',
        label: 'Assignments',
        shortLabel: 'AS',
        description: 'Cycle assignment and day tracking',
        featured: true,
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Tracking and history',
    entries: [
      {
        id: 'statistic',
        path: '/statistic',
        label: 'Statistics',
        shortLabel: 'ST',
        description: 'Spending, nutrition goals and product prices',
        featured: true,
      },
    ],
  },
];

export const APP_NAVIGATION_ENTRIES = APP_NAVIGATION.flatMap((group) =>
  group.entries.map((entry) => ({ group, entry })),
);

export const APP_SIDEBAR_NAVIGATION: AppNavigationGroup[] = [
  {
    id: 'featured',
    label: 'Features',
    description: 'Quick access to core modules',
    entries: APP_NAVIGATION_ENTRIES.filter(({ entry }) => entry.featured).map(({ entry }) => entry),
  },
];

export function findNavigationContextByUrl(
  url: string,
): { group: AppNavigationGroup; entry: AppNavigationEntry } | null {
  const normalizedUrl = normalizeUrl(url);

  const auxiliaryTitles: Record<string, string> = {
    '/nutrition-value': 'Nutrition values',
    '/input-day': 'Day input',
    '/calendar': 'Calendar',
  };
  const auxiliaryTitle = auxiliaryTitles[normalizedUrl];
  if (auxiliaryTitle) {
    return {
      group: { id: 'tools', label: 'Tools', description: 'API tools', entries: [] },
      entry: { id: normalizedUrl.slice(1), path: normalizedUrl, label: auxiliaryTitle, shortLabel: auxiliaryTitle, description: '' },
    };
  }

  return APP_NAVIGATION_ENTRIES.find(({ entry }) => entry.path === normalizedUrl) ?? null;
}

function normalizeUrl(url: string): string {
  const trimmedUrl = (url || '').split('?')[0]?.split('#')[0] ?? '';
  if (!trimmedUrl) {
    return '/home';
  }

  return trimmedUrl.startsWith('/') ? trimmedUrl : `/${trimmedUrl}`;
}
