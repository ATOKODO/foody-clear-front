import { NutritionKeyMeta } from '../../services/meta-service';

const ENERGY_KEY_CANDIDATES = ['ENERGY_KCAL', 'ENERGY', 'CALORIES', 'CALORIE', 'KCAL'];
const ENERGY_LABEL_CANDIDATES = ['energie', 'energy', 'kcal', 'calorie'];

const PROTEIN_KEY_CANDIDATES = ['PROTEIN'];
const PROTEIN_LABEL_CANDIDATES = ['proteine', 'protein'];

const CARBOHYDRATE_KEY_CANDIDATES = ['CARBOHYDRATE'];
const CARBOHYDRATE_LABEL_CANDIDATES = ['glucide', 'carbohydrate', 'carb'];

const FAT_KEY_CANDIDATES = ['FAT'];
const FAT_LABEL_CANDIDATES = ['lipide', 'fat', 'lipid'];

export function resolveDefaultNutritionKeys(nutritionKeys: NutritionKeyMeta[]): string[] {
  return [
    resolveNutritionKey(
      nutritionKeys,
      ENERGY_KEY_CANDIDATES,
      ENERGY_LABEL_CANDIDATES,
      'ENERGY',
    ),
    resolveNutritionKey(
      nutritionKeys,
      PROTEIN_KEY_CANDIDATES,
      PROTEIN_LABEL_CANDIDATES,
      'PROTEIN',
    ),
    resolveNutritionKey(
      nutritionKeys,
      CARBOHYDRATE_KEY_CANDIDATES,
      CARBOHYDRATE_LABEL_CANDIDATES,
      'CARBOHYDRATE',
    ),
    resolveNutritionKey(nutritionKeys, FAT_KEY_CANDIDATES, FAT_LABEL_CANDIDATES, 'FAT'),
  ];
}

export function getFallbackUnitsForNutritionKey(nutritionKey: string): string[] {
  return isEnergyNutritionKey(nutritionKey) ? ['KCAL'] : ['G', 'MG'];
}

function resolveNutritionKey(
  nutritionKeys: NutritionKeyMeta[],
  keyCandidates: string[],
  labelCandidates: string[],
  fallback: string,
): string {
  const normalizedKeyCandidates = new Set(keyCandidates.map((candidate) => candidate.toUpperCase()));
  const normalizedLabelCandidates = labelCandidates.map((candidate) => candidate.toUpperCase());

  const exactMatch = nutritionKeys.find((nutritionKey) => {
    const value = nutritionKey.value.trim().toUpperCase();
    const key = nutritionKey.key.trim().toUpperCase();
    return normalizedKeyCandidates.has(value) || normalizedKeyCandidates.has(key);
  });
  if (exactMatch) {
    return exactMatch.value;
  }

  const labelMatch = nutritionKeys.find((nutritionKey) => {
    const label = nutritionKey.label.trim().toUpperCase();
    return normalizedLabelCandidates.some((candidate) => label.includes(candidate));
  });
  if (labelMatch) {
    return labelMatch.value;
  }

  return fallback;
}

function isEnergyNutritionKey(nutritionKey: string): boolean {
  const normalized = nutritionKey.trim().toUpperCase();
  if (normalized === '') {
    return false;
  }

  return (
    ENERGY_KEY_CANDIDATES.includes(normalized) ||
    normalized.includes('ENERG') ||
    normalized.includes('KCAL') ||
    normalized.includes('CALOR')
  );
}
