import type { ProductListItem } from '../../components/product/product-list/product-list';
import type { Product } from '../../services/product-service';
import type { Inventory, InventoryProduct } from '../../interfaces/inventory.interface';
import {
  INVENTORY_PURCHASE_ACCOUNTING_MODE_OPTIONS,
  buildInventoryListItems,
  buildProductListItems,
  extractInventoriesFromResponse,
  extractInventoryProductsFromResponse,
  extractProductsFromResponse,
  filterInventorySelectionRows,
  getInventoryQtyUnitHelpText,
  getInventoryQtyUnitOptions,
  removeInventoryProductRow,
  syncInventorySelectedProductRows,
  toCreateInventoryDto,
  toInventoryFormValue,
  toInventoryProductQtyPayload,
  toManagedInventoryProductRows,
  validateManagedInventoryProductRows,
  validatePositiveInventoryQtyRows,
} from './inventory.viewmodel';

describe('inventory viewmodel', () => {
  const product: Product = {
    id: 1,
    name: 'Pasta',
    unitType: 'Paquet',
    quantityPerUnit: 500,
    quantityUnit: 'g',
    portionCount: 5,
    portionUnit: 'portion',
    portionQuantityNormalized: 100,
    price: 2.5,
  };
  const productItem = {
    id: '1',
    name: 'Pasta',
    unitType: 'Paquet',
    quantityPerUnit: 500,
    quantityUnit: 'g',
    portionCount: 5,
    portionUnit: 'portion',
    portionQuantityNormalized: 100,
    price: 2.5,
  } as ProductListItem;
  const row = {
    productId: 1,
    productName: 'Pasta',
    qty: 2,
    qtyUnit: 'kg' as const,
    qtyUnitOptions: [],
    qtyUnitHelpText: null,
    purchaseAccountingMode: 'paid' as const,
    unitType: 'Paquet',
    quantityPerUnit: 500,
    quantityUnit: 'g' as const,
    portionCount: 5,
    portionUnit: 'portion' as const,
    portionQuantityNormalized: 100,
    price: 2.5,
  };

  it('maps inventory and product collections and builds DTOs', () => {
    const inventory = { id: 4, name: 'Pantry', productCount: 2 } as Inventory;
    expect(INVENTORY_PURCHASE_ACCOUNTING_MODE_OPTIONS.map((option) => option.value)).toEqual(['paid', 'free', 'excluded']);
    expect(buildInventoryListItems([inventory, { id: 5, name: 'Empty', inventoryProducts: [] } as Inventory])).toEqual([
      { id: '4', name: 'Pantry', productCount: 2 },
      { id: '5', name: 'Empty', productCount: 0 },
    ]);
    expect(buildProductListItems([product])[0].name).toBe('Pasta');
    expect(toInventoryFormValue(inventory)).toEqual({ name: 'Pantry' });
    expect(toCreateInventoryDto({ name: ' Pantry ' }, [])).toEqual({ name: 'Pantry' });
    expect(toCreateInventoryDto({ name: 'Pantry' }, [row])).toEqual({
      name: 'Pantry',
      products: [{ productId: 1, qty: 2, qtyUnit: 'kg', purchaseAccountingMode: 'paid' }],
    });
  });

  it('synchronizes and filters selected rows while normalizing metadata', () => {
    const newRows = syncInventorySelectedProductRows([productItem], []);
    expect(newRows[0].qty).toBeNull();
    expect(newRows[0].qtyUnit).toBe('unit');
    expect(newRows[0].purchaseAccountingMode).toBe('paid');
    const existing = { ...row, qtyUnit: 'g' as const, purchaseAccountingMode: 'invalid' as any };
    const updatedRows = syncInventorySelectedProductRows([productItem], [existing]);
    expect(updatedRows[0].qty).toBe(2);
    expect(updatedRows[0].qtyUnit).toBe('g');
    expect(updatedRows[0].purchaseAccountingMode).toBe('paid');
    expect(filterInventorySelectionRows([row, { ...row, productId: 99 }], [productItem])).toHaveSize(1);
    expect(removeInventoryProductRow([row, { ...row, productId: 2 }], 1)).toEqual([{ ...row, productId: 2 }]);
  });

  it('validates and creates quantity payloads', () => {
    expect(toInventoryProductQtyPayload([row])).toEqual([{ productId: 1, qty: 2, qtyUnit: 'kg' }]);
    expect(toInventoryProductQtyPayload([{ ...row, qtyUnit: 'unit' }])).toEqual([{ productId: 1, qty: 2 }]);
    expect(toInventoryProductQtyPayload([row], true)[0]).toEqual({
      productId: 1,
      qty: 2,
      qtyUnit: 'kg',
      purchaseAccountingMode: 'paid',
    });
    expect(toInventoryProductQtyPayload([{ ...row, qty: 0 }, { ...row, qty: Number.NaN }])).toEqual([]);
    expect(validatePositiveInventoryQtyRows([])).toBeNull();
    expect(validatePositiveInventoryQtyRows([row])).toBeNull();
    expect(validatePositiveInventoryQtyRows([{ ...row, qty: 0 }])).toContain('quantite');
    expect(validateManagedInventoryProductRows([{ ...row, currentQty: 0 } as any])).toBeNull();
    expect(validateManagedInventoryProductRows([{ ...row, qty: -1 } as any])).toContain('quantite');
  });

  it('extracts response shapes and builds managed rows', () => {
    const inventory = { id: 4, name: 'Pantry' } as Inventory;
    const inventoryProduct = {
      id: 8,
      inventoryId: 4,
      productId: 1,
      qtyOnHandInUnits: 3.5,
      qtyOnHandNormalized: 1750,
      product,
    } as InventoryProduct;
    expect(extractInventoriesFromResponse([inventory])).toEqual([inventory]);
    expect(extractInventoriesFromResponse(inventory)).toEqual([inventory]);
    expect(extractInventoriesFromResponse({ data: [inventory, { nope: true }] })).toEqual([inventory]);
    expect(extractInventoriesFromResponse({ payload: [] })).toEqual([]);
    expect(extractInventoriesFromResponse(null)).toEqual([]);
    expect(extractProductsFromResponse([product])).toEqual([product]);
    expect(extractProductsFromResponse({ products: [product] })).toEqual([product]);
    expect(extractProductsFromResponse({ items: [{ id: 1 }] })).toEqual([]);
    expect(extractInventoryProductsFromResponse([inventoryProduct])).toEqual([inventoryProduct]);
    expect(extractInventoryProductsFromResponse({ inventoryProducts: [inventoryProduct] })).toEqual([inventoryProduct]);
    expect(extractInventoryProductsFromResponse({ data: [{ id: 1 }] })).toEqual([]);
    const managed = toManagedInventoryProductRows([inventoryProduct, {
      ...inventoryProduct,
      id: 9,
      productId: 99,
      qtyOnHandInUnits: Number.NaN,
      qtyOnHandNormalized: Number.NaN,
      product: null,
    }]);
    expect(managed[0].currentQty).toBe(3.5);
    expect(managed[0].currentQtyDisplay).toContain('Paquet');
    expect(managed[1].productName).toBe('Product #99');
    expect(managed[1].currentQty).toBe(0);
    expect(managed[1].currentNormalizedQty).toBeNull();
  });

  it('resolves quantity options and explanatory text', () => {
    expect(getInventoryQtyUnitOptions({
      unitType: 'Paquet',
      quantityPerUnit: 500,
      quantityUnit: 'g',
      portionCount: 5,
      portionUnit: 'portion',
      portionQuantityNormalized: 100,
      price: 2,
    })).toEqual([
      { value: 'unit', label: 'Product unit (Paquet)' },
      { value: 'g', label: 'G' },
      { value: 'portion', label: 'Portion' },
    ]);
    expect(getInventoryQtyUnitOptions({
      unitType: null,
      quantityPerUnit: null,
      quantityUnit: null,
      portionCount: null,
      portionUnit: null,
      portionQuantityNormalized: null,
      price: null,
    })).toEqual([{ value: 'unit', label: 'Product unit' }]);
    expect(getInventoryQtyUnitHelpText({
      unitType: '',
      quantityPerUnit: 500.5,
      quantityUnit: 'g',
      portionCount: 2,
      portionUnit: 'portion',
      portionQuantityNormalized: 100,
      price: null,
    })).toContain('unite produit');
    expect(getInventoryQtyUnitHelpText({
      unitType: null,
      quantityPerUnit: null,
      quantityUnit: null,
      portionCount: null,
      portionUnit: null,
      portionQuantityNormalized: null,
      price: null,
    })).toBeNull();
  });

  it('handles legacy inventory counts and invalid product metadata', () => {
    expect(buildInventoryListItems([
      {
        id: 6,
        name: 'Legacy array',
        productCount: -1,
        inventoryProducts: [{ id: 1 }],
      } as unknown as Inventory,
      {
        id: 7,
        name: 'Legacy field',
        productCount: -1,
        productsCount: 2.8,
      } as unknown as Inventory,
      {
        id: 8,
        name: 'Fallback field',
        productCount: -1,
        productsCount: 'invalid',
        inventoryProductsCount: 3,
      } as unknown as Inventory,
      {
        id: 9,
        name: 'No count',
        productCount: -1,
        productsCount: 'invalid',
        inventoryProductsCount: 'invalid',
      } as unknown as Inventory,
    ])).toEqual([
      { id: '6', name: 'Legacy array', productCount: 1 },
      { id: '7', name: 'Legacy field', productCount: 2 },
      { id: '8', name: 'Fallback field', productCount: 3 },
      { id: '9', name: 'No count', productCount: 0 },
    ]);

    expect(extractProductsFromResponse(null)).toEqual([]);
    expect(extractInventoryProductsFromResponse(null)).toEqual([]);

    const invalidMetaItem = {
      ...productItem,
      quantityUnit: 'invalid',
      portionUnit: 'invalid',
    } as unknown as ProductListItem;
    const invalidMetaRow = syncInventorySelectedProductRows(
      [invalidMetaItem],
      [],
    )[0];
    expect(invalidMetaRow.qtyUnit).toBe('unit');
    expect(invalidMetaRow.quantityUnit).toBeNull();
    expect(invalidMetaRow.portionUnit).toBeNull();

    expect(
      syncInventorySelectedProductRows(
        [productItem],
        [{ ...row, qtyUnit: 'unit' }],
      )[0].qtyUnit,
    ).toBe('unit');
    expect(
      syncInventorySelectedProductRows(
        [productItem],
        [{ ...row, qtyUnit: 'invalid' as never }],
      )[0].qtyUnit,
    ).toBe('unit');
  });
});
