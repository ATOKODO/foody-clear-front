export type AppNavigationEntry = {
  id: string;
  path: string;
  label: string;
  shortLabel: string;
  description: string;
  featured?: boolean;
};

export type AppNavigationGroup = {
  id: string;
  label: string;
  description: string;
  entries: AppNavigationEntry[];
};

export const APP_NAVIGATION: AppNavigationGroup[] = [
  {
    id: 'home',
    label: 'Accueil',
    description: "Vue d'ensemble et raccourcis",
    entries: [
      {
        id: 'home',
        path: '/home',
        label: 'Accueil',
        shortLabel: 'AC',
        description: "Tableau de bord, workflows et points d'entree",
        featured: true,
      },
    ],
  },
  {
    id: 'catalog',
    label: 'Catalogue',
    description: 'Produits, structure et metadonnees',
    entries: [
      {
        id: 'product',
        path: '/product',
        label: 'Catalogue',
        shortLabel: 'CA',
        description: 'Produits, categories, tags et produits generiques',
        featured: true,
      },
      {
        id: 'category',
        path: '/category',
        label: 'Categories',
        shortLabel: 'CT',
        description: 'Organisation, alertes et seuils minimums',
      },
      {
        id: 'generic-product',
        path: '/generic-product',
        label: 'Produits generiques',
        shortLabel: 'PG',
        description: 'Referentiel de stock et conversions',
      },
      {
        id: 'tag',
        path: '/tag',
        label: 'Tags',
        shortLabel: 'TG',
        description: 'Taxonomie et filtres transverses',
      },
      {
        id: 'nutrition-value',
        path: '/nutrition-value',
        label: 'Valeurs nutritionnelles',
        shortLabel: 'VN',
        description: 'Validation rapide des endpoints nutrition',
      },
    ],
  },
  {
    id: 'operations',
    label: 'Stocks & execution',
    description: 'Stocks, saisie du jour et execution',
    entries: [
      {
        id: 'inventory',
        path: '/inventory',
        label: 'Inventaires',
        shortLabel: 'IN',
        description: "Stocks, quantites et mouvements d'ajout",
        featured: true,
      },
      {
        id: 'shopping-list',
        path: '/shopping-list',
        label: 'Listes de course',
        shortLabel: 'LC',
        description: "Preparation d'achats, checklists et conversion en stock",
      },
      {
        id: 'input-day',
        path: '/input-day',
        label: 'Saisie du jour',
        shortLabel: 'SJ',
        description: 'Execution quotidienne, stocks et templates actifs',
      },
    ],
  },
  {
    id: 'planning',
    label: 'Planning',
    description: 'Cycles, gabarits et calendrier',
    entries: [
      {
        id: 'cycle',
        path: '/cycle',
        label: 'Cycles',
        shortLabel: 'CY',
        description: 'Hub cycle, jours types et plages horaires',
        featured: true,
      },
      {
        id: 'day-set',
        path: '/day-set',
        label: 'Jours types',
        shortLabel: 'DS',
        description: 'Journees type et cibles nutritionnelles',
      },
      {
        id: 'slot',
        path: '/slot',
        label: 'Plages horaires',
        shortLabel: 'SL',
        description: 'Plages de repas et cibles par slot',
      },
      {
        id: 'template',
        path: '/template',
        label: 'Modeles',
        shortLabel: 'TP',
        description: 'Journees previsionnelles et verification stock',
        featured: true,
      },
      {
        id: 'calendar',
        path: '/calendar',
        label: 'Calendrier',
        shortLabel: 'CL',
        description: 'Lecture annuelle, mensuelle et journaliere',
      },
      {
        id: 'planning',
        path: '/planning',
        label: 'Assignations',
        shortLabel: 'AS',
        description: 'Affectation des cycles et suivi des jours',
        featured: true,
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analyse',
    description: 'Suivi et historique',
    entries: [
      {
        id: 'statistic',
        path: '/statistic',
        label: 'Statistiques',
        shortLabel: 'ST',
        description: 'Depenses, objectifs nutritionnels et prix produits',
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
    description: 'Acces rapides aux modules principaux',
    entries: APP_NAVIGATION_ENTRIES.filter(({ entry }) => entry.featured).map(({ entry }) => entry),
  },
  ...APP_NAVIGATION.map((group) => ({
    ...group,
    entries: group.entries.filter((entry) => !entry.featured),
  })).filter((group) => group.entries.length > 0),
];

export function findNavigationContextByUrl(
  url: string,
): { group: AppNavigationGroup; entry: AppNavigationEntry } | null {
  const normalizedUrl = normalizeUrl(url);

  return APP_NAVIGATION_ENTRIES.find(({ entry }) => entry.path === normalizedUrl) ?? null;
}

function normalizeUrl(url: string): string {
  const trimmedUrl = (url || '').split('?')[0]?.split('#')[0] ?? '';
  if (!trimmedUrl) {
    return '/home';
  }

  return trimmedUrl.startsWith('/') ? trimmedUrl : `/${trimmedUrl}`;
}
