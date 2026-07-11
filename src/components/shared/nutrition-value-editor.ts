import { CycleNutritionValue } from '../../interfaces/cycle.interface';
import { NutritionKeyMeta } from '../../services/meta-service';
import {
  getFallbackUnitsForNutritionKey,
  resolveDefaultNutritionKeys,
} from './default-nutrition-values';

export class NutritionValueEditor {
  constructor(private readonly nutritionKeys: () => NutritionKeyMeta[]) {}

  createDefaultValue(nutritionKey = ''): CycleNutritionValue {
    return {
      nutritionKey,
      amount: 0,
      unit: this.pickDefaultUnit(nutritionKey),
      reference: 'PER_100G',
    };
  }

  createDefaultValues(): CycleNutritionValue[] {
    return this.cloneValues(
      resolveDefaultNutritionKeys(this.nutritionKeys()).map((key) =>
        this.createDefaultValue(key),
      ),
    );
  }

  cloneValues(values: CycleNutritionValue[]): CycleNutritionValue[] {
    return values.map((value) => this.normalizeValue(value));
  }

  normalizeValue(value: CycleNutritionValue): CycleNutritionValue {
    const nutritionKey = (value.nutritionKey ?? '').trim();
    return {
      nutritionKey,
      amount: Number.isFinite(value.amount) ? Math.max(0, value.amount) : 0,
      unit: this.pickDefaultUnit(nutritionKey, value.unit),
      reference: value.reference === 'PER_100ML' ? 'PER_100ML' : 'PER_100G',
    };
  }

  normalizeValuesForSubmission(values: CycleNutritionValue[]): CycleNutritionValue[] {
    return this.cloneValues(values).filter((value) => value.nutritionKey !== '');
  }

  ensureUnit(value: CycleNutritionValue): void {
    const allowedUnits = this.getAllowedUnits(value.nutritionKey);
    if (allowedUnits.length === 0) {
      value.unit = this.getFallbackUnits(value.nutritionKey)[0];
      return;
    }

    if (!allowedUnits.includes(value.unit)) {
      value.unit = allowedUnits[0];
    }
  }

  getUnitsForKey(nutritionKey: string): string[] {
    const allowedUnits = this.getAllowedUnits(nutritionKey);
    return allowedUnits.length > 0 ? allowedUnits : this.getFallbackUnits(nutritionKey);
  }

  private pickDefaultUnit(nutritionKey: string, preferred?: string): string {
    const allowedUnits = this.getAllowedUnits(nutritionKey);
    if (allowedUnits.length === 0) {
      return preferred && preferred.trim() !== ''
        ? preferred
        : this.getFallbackUnits(nutritionKey)[0];
    }

    if (preferred && allowedUnits.includes(preferred)) {
      return preferred;
    }

    return allowedUnits.find((unit) => unit.toUpperCase() === 'G') ?? allowedUnits[0];
  }

  private getAllowedUnits(nutritionKey: string): string[] {
    if (nutritionKey.trim() === '') {
      return [];
    }

    const key = this.nutritionKeys().find(
      (item) =>
        item.value.toUpperCase() === nutritionKey.toUpperCase() ||
        item.key.toUpperCase() === nutritionKey.toUpperCase(),
    );

    return key ? key.allowedUnits.filter((unit) => unit.trim() !== '') : [];
  }

  private getFallbackUnits(nutritionKey: string): string[] {
    return getFallbackUnitsForNutritionKey(nutritionKey);
  }
}
