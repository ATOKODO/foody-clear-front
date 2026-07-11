import { CycleNutritionValue } from '../../interfaces/cycle.interface';

export type MacroKey = 'protein' | 'carbs' | 'fat';

export interface NutritionSummary {
  nutritionValues?: CycleNutritionValue[];
  protein?: number;
  carbs?: number;
  fat?: number;
}

export function getNutritionMacro(item: NutritionSummary, key: MacroKey): number {
  const values = item.nutritionValues ?? [];
  if (values.length === 0) {
    return roundNumber(item[key] ?? 0);
  }

  const totals = { protein: 0, carbs: 0, fat: 0 };
  for (const value of values) {
    const amount = toGrams(value.amount, value.unit);
    switch (value.nutritionKey.toUpperCase()) {
      case 'PROTEIN':
        totals.protein += amount;
        break;
      case 'CARBOHYDRATE':
        totals.carbs += amount;
        break;
      case 'FAT':
        totals.fat += amount;
        break;
    }
  }

  return roundNumber(totals[key]);
}

function toGrams(amount: number, unit: string): number {
  switch (unit.toUpperCase()) {
    case 'G':
      return amount;
    case 'MG':
      return amount / 1000;
    default:
      return 0;
  }
}

function roundNumber(value: number): number {
  return Math.round(value * 100) / 100;
}
