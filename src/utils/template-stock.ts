import type { InputDayTemplateItemSummary } from '../interfaces/input-day.interface';

export function getSelectedTemplateStock(item: InputDayTemplateItemSummary, inventoryIds: readonly number[]): {
  enoughStock: boolean;
  qtyAvailableNormalized: number;
} | null {
  const stocks = item.stockByInventory.filter((stock) => inventoryIds.includes(stock.inventoryId));
  if (stocks.length === 0) return null;
  const qtyAvailableNormalized = stocks.reduce((sum, stock) => sum + stock.qtyAvailableNormalized, 0);
  const requirements = new Map<number, number>();
  const availableByProduct = new Map<number, number>();
  for (const stock of stocks) {
    for (const product of stock.productStocks ?? []) {
      requirements.set(product.productId, product.requestedQtyNormalized);
      availableByProduct.set(product.productId, (availableByProduct.get(product.productId) ?? 0) + product.qtyAvailableNormalized);
    }
  }
  const enoughStock = requirements.size > 0
    ? Array.from(requirements).every(([productId, qty]) => (availableByProduct.get(productId) ?? 0) + 1e-6 >= qty)
    : item.itemType === 'dish' || item.itemType === 'meal'
      ? stocks.some((stock) => stock.enoughStock)
      : qtyAvailableNormalized + 1e-6 >= item.stockAvailability.requestedQtyNormalized;
  return { enoughStock, qtyAvailableNormalized: Math.round(qtyAvailableNormalized * 1e6) / 1e6 };
}

export function getTemplateInventoryIds(item: InputDayTemplateItemSummary): number[] {
  const ids = [...new Set(item.stockByInventory.filter((stock) => stock.qtyAvailableNormalized > 0 || stock.enoughStock).map((stock) => stock.inventoryId))];
  return item.stockAvailability.enoughStock && getSelectedTemplateStock(item, ids)?.enoughStock ? ids : [];
}
