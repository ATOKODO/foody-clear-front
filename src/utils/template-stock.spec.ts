import type { InputDayTemplateItemSummary } from '../interfaces/input-day.interface';
import { getSelectedTemplateStock, getTemplateInventoryIds } from './template-stock';

describe('template stock', () => {
  it('accepts a product spread over selected inventories and rejects a partial selection', () => {
    const item = {
      itemType: 'product',
      stockAvailability: { enoughStock: true, requestedQtyNormalized: 100, totalAvailableNormalized: 110 },
      stockByInventory: [
        { inventoryId: 1, inventoryName: 'A', qtyAvailableNormalized: 60, enoughStock: false },
        { inventoryId: 2, inventoryName: 'B', qtyAvailableNormalized: 50, enoughStock: false },
      ],
    } as InputDayTemplateItemSummary;
    expect(getSelectedTemplateStock(item, [1])?.enoughStock).toBeFalse();
    expect(getSelectedTemplateStock(item, [1, 2, 1])).toEqual({ enoughStock: true, qtyAvailableNormalized: 110 });
    expect(getTemplateInventoryIds(item)).toEqual([1, 2]);
  });

  it('checks every recipe ingredient instead of adding quantities of different products', () => {
    const item = {
      itemType: 'dish',
      stockAvailability: { enoughStock: true, requestedQtyNormalized: 110, totalAvailableNormalized: 1010 },
      stockByInventory: [
        { inventoryId: 1, inventoryName: 'A', qtyAvailableNormalized: 1000, enoughStock: false, productStocks: [
          { productId: 3, requestedQtyNormalized: 100, qtyAvailableNormalized: 1000 },
          { productId: 4, requestedQtyNormalized: 10, qtyAvailableNormalized: 0 },
        ] },
        { inventoryId: 2, inventoryName: 'B', qtyAvailableNormalized: 10, enoughStock: false, productStocks: [
          { productId: 3, requestedQtyNormalized: 100, qtyAvailableNormalized: 0 },
          { productId: 4, requestedQtyNormalized: 10, qtyAvailableNormalized: 10 },
        ] },
      ],
    } as InputDayTemplateItemSummary;
    expect(getSelectedTemplateStock(item, [1])?.enoughStock).toBeFalse();
    expect(getSelectedTemplateStock(item, [1, 2])?.enoughStock).toBeTrue();
    expect(getTemplateInventoryIds(item)).toEqual([1, 2]);
  });
});
