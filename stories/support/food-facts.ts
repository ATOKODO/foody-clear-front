import type { FoodFactsProduct } from '../../src/services/open-food-facts-service';

export const demoFoodFactsProduct: FoodFactsProduct = {
  barcode: '3017620422003', name: 'Demo banana', brands: 'Foody Clear', quantity: '120 g',
  quantityPerUnit: 120, quantityUnit: 'g', ingredients: 'Banana', allergens: [], nutriScore: 'a',
  imageUrl: null, sourceUrl: 'https://world.openfoodfacts.org/product/3017620422003',
  nutritionValues: [{ nutritionKey: 'ENERGY_KCAL', amount: 89, unit: 'kcal', reference: 'PER_100G' }],
};
