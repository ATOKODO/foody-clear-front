import {
  buildInputDayItemEditorRequest,
  buildInputDaySelectedItemsRequest,
  canCreateInputDaySelectedItems,
  canSubmitInputDayItemEditor,
  type InputDayItemEditorAvailabilityInput,
  type InputDayItemEditorRequestInput,
  type InputDaySelectedItemsAvailabilityInput,
  type InputDaySelectedItemsRequestInput,
} from './input-day.commands';
import type { ProductQuantityInputUnit } from '../../interfaces/input-day.interface';
import type { InputDaySelectedProductRow } from './input-day.models';

describe('input-day commands', () => {
  const qtyUnitSet = new Set<ProductQuantityInputUnit>(['g', 'unit']);
  const validValue = {
    dateLocal: '2026-02-16',
    productId: 7,
    qty: 2,
    qtyUnit: 'g',
    occurredAt: '',
    slotId: null,
    slotKey: 'breakfast',
  };
  const validRows: InputDaySelectedProductRow[] = [
    { productId: 7, productName: 'Rice', qty: 2, qtyUnit: 'g' },
  ];

  function editorAvailability(
    overrides: Partial<InputDayItemEditorAvailabilityInput> = {},
  ): InputDayItemEditorAvailabilityInput {
    return {
      value: validValue,
      timezone: 'UTC',
      hasValidSelectedDate: true,
      hasSelectedInventories: true,
      initialDateError: null,
      loading: false,
      loadingProducts: false,
      loadingInventories: false,
      hasProductsError: false,
      hasInventoriesError: false,
      hasInventoryProductsError: false,
      ...overrides,
    };
  }

  function editorRequest(
    overrides: Partial<InputDayItemEditorRequestInput> = {},
  ): InputDayItemEditorRequestInput {
    return {
      value: validValue,
      selectedInventoryIds: [4],
      qtyUnitSet,
      timezone: 'UTC',
      resolveUpdateRequestDateLocal: () => '2026-02-16',
      ...overrides,
    };
  }

  function selectedItemsRequest(
    overrides: Partial<InputDaySelectedItemsRequestInput> = {},
  ): InputDaySelectedItemsRequestInput {
    return {
      value: validValue,
      selectedProductRows: validRows,
      selectedInventoryIds: [4],
      selectedSlotId: null,
      qtyUnitSet,
      timezone: 'UTC',
      hasValidSelectedDate: true,
      initialDateError: null,
      ...overrides,
    };
  }

  function selectedAvailability(
    overrides: Partial<InputDaySelectedItemsAvailabilityInput> = {},
  ): InputDaySelectedItemsAvailabilityInput {
    return {
      value: validValue,
      timezone: 'UTC',
      hasValidSelectedDate: true,
      hasSelectedInventories: true,
      initialDateError: null,
      loading: false,
      loadingProducts: false,
      loadingInventories: false,
      loadingInventoryProducts: false,
      hasProductsError: false,
      hasInventoriesError: false,
      hasInventoryProductsError: false,
      selectedProductRows: validRows,
      ...overrides,
    };
  }

  it('rejects editor submission while loading or when required data is unavailable', () => {
    const loadingFlags = [
      'loading',
      'loadingProducts',
      'loadingInventories',
      'hasProductsError',
      'hasInventoriesError',
      'hasInventoryProductsError',
    ] as const;

    loadingFlags.forEach((flag) => {
      expect(
        canSubmitInputDayItemEditor(editorAvailability({ [flag]: true })),
      ).toBeFalse();
    });

    expect(
      canSubmitInputDayItemEditor(editorAvailability({ initialDateError: 'invalid' })),
    ).toBeFalse();
    expect(
      canSubmitInputDayItemEditor(editorAvailability({ hasValidSelectedDate: false })),
    ).toBeFalse();
    expect(
      canSubmitInputDayItemEditor(editorAvailability({ hasSelectedInventories: false })),
    ).toBeFalse();
  });

  it('validates editor values before allowing a submission', () => {
    const invalidValues = [
      { dateLocal: 'invalid' },
      { productId: null },
      { qty: null },
      { qty: '2' },
      { qty: 0 },
      { occurredAt: 'invalid' },
    ];

    invalidValues.forEach((change) => {
      expect(
        canSubmitInputDayItemEditor(
          editorAvailability({ value: { ...validValue, ...change } }),
        ),
      ).toBeFalse();
    });

    expect(canSubmitInputDayItemEditor(editorAvailability())).toBeTrue();
    expect(
      canSubmitInputDayItemEditor(
        editorAvailability({
          value: { ...validValue, occurredAt: '2026-02-16T08:00' },
        }),
      ),
    ).toBeTrue();
  });

  it('rejects selected-item creation until all prerequisites are ready', () => {
    const loadingFlags = [
      'loading',
      'loadingProducts',
      'loadingInventories',
      'loadingInventoryProducts',
      'hasProductsError',
      'hasInventoriesError',
      'hasInventoryProductsError',
    ] as const;

    loadingFlags.forEach((flag) => {
      expect(
        canCreateInputDaySelectedItems({
          ...selectedAvailability(),
          [flag]: true,
        }),
      ).toBeFalse();
    });

    expect(
      canCreateInputDaySelectedItems(
        selectedAvailability({ hasValidSelectedDate: false }),
      ),
    ).toBeFalse();
    expect(
      canCreateInputDaySelectedItems(
        selectedAvailability({ initialDateError: 'invalid' }),
      ),
    ).toBeFalse();
    expect(
      canCreateInputDaySelectedItems(
        selectedAvailability({ hasProductsError: true }),
      ),
    ).toBeFalse();
    expect(
      canCreateInputDaySelectedItems(
        selectedAvailability({ hasSelectedInventories: false }),
      ),
    ).toBeFalse();
  });

  it('validates selected-item date, timestamp, rows, and quantities', () => {
    const invalidValues = [
      { dateLocal: 'invalid' },
      { occurredAt: 'invalid' },
    ];

    invalidValues.forEach((change) => {
      expect(
        canCreateInputDaySelectedItems(
          selectedAvailability({ value: { ...validValue, ...change } }),
        ),
      ).toBeFalse();
    });
    expect(
      canCreateInputDaySelectedItems(
        selectedAvailability({ selectedProductRows: [] }),
      ),
    ).toBeFalse();
    expect(
      canCreateInputDaySelectedItems(
        selectedAvailability({
          selectedProductRows: [{ ...validRows[0], qty: null }],
        }),
      ),
    ).toBeFalse();
    expect(
      canCreateInputDaySelectedItems(
        selectedAvailability({
          selectedProductRows: [{ ...validRows[0], qty: Number.NaN }],
        }),
      ),
    ).toBeFalse();
    expect(
      canCreateInputDaySelectedItems(
        selectedAvailability({
          selectedProductRows: [{ ...validRows[0], qty: 0 }],
        }),
      ),
    ).toBeFalse();

    expect(canCreateInputDaySelectedItems(selectedAvailability())).toBeTrue();
    expect(
      canCreateInputDaySelectedItems(
        selectedAvailability({
          value: { ...validValue, occurredAt: '2026-02-16T08:00' },
        }),
      ),
    ).toBeTrue();
  });

  it('returns precise editor validation errors', () => {
    const invalidCases = [
      ['date', { value: { ...validValue, dateLocal: 'invalid' } }],
      ['inventory', { selectedInventoryIds: [] }],
      ['product', { value: { ...validValue, productId: null } }],
      ['quantity-null', { value: { ...validValue, qty: null } }],
      ['quantity-type', { value: { ...validValue, qty: '2' } }],
      ['quantity-nan', { value: { ...validValue, qty: Number.NaN } }],
      ['quantity-range', { value: { ...validValue, qty: 0 } }],
      ['unit-type', { value: { ...validValue, qtyUnit: 2 } }],
      ['unit-value', { value: { ...validValue, qtyUnit: 'invalid' } }],
      ['occurredAt', { value: { ...validValue, occurredAt: 'invalid' } }],
    ] as const;

    invalidCases.forEach(([, change]) => {
      const result = buildInputDayItemEditorRequest(
        editorRequest(change),
      );
      expect(result.request).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  it('builds create and update requests with optional fields', () => {
    const createWithoutOptionalFields = buildInputDayItemEditorRequest(
      editorRequest({
        value: { ...validValue, qtyUnit: null, slotKey: ' breakfast ' },
      }),
    );
    expect(createWithoutOptionalFields).toEqual({
      request: {
        itemId: null,
        requestDateLocal: '2026-02-16',
        payload: {
          productId: 7,
          inventoryId: 4,
          qty: 2,
          slotKey: 'breakfast',
        },
      },
      error: null,
    });

    const createWithOptionalFields = buildInputDayItemEditorRequest(
      editorRequest({
        value: {
          ...validValue,
          occurredAt: '2026-02-16T08:00',
          slotId: 3,
        },
      }),
    );
    expect(createWithOptionalFields.request).toEqual(
      jasmine.objectContaining({
        itemId: null,
        payload: jasmine.objectContaining({
          occurredAt: jasmine.any(String),
          qtyUnit: 'g',
          slotId: 3,
        }),
      }),
    );

    expect(
      buildInputDayItemEditorRequest(
        editorRequest({
          value: { ...validValue, itemId: 9 },
          resolveUpdateRequestDateLocal: () => null,
        }),
      ),
    ).toEqual({ request: null, error: null });

    const update = buildInputDayItemEditorRequest(
      editorRequest({
        value: { ...validValue, itemId: 9 },
      }),
    );
    expect(update.request).toEqual(
      jasmine.objectContaining({
        itemId: 9,
        requestDateLocal: '2026-02-16',
        payload: jasmine.objectContaining({
          dateLocal: '2026-02-16',
          slotKey: 'breakfast',
          slotId: null,
        }),
      }),
    );
  });

  it('validates and builds requests for multiple selected products', () => {
    const invalidCases = [
      { hasValidSelectedDate: false },
      { initialDateError: 'invalid' },
      { selectedInventoryIds: [] },
      { selectedProductRows: [] },
      { value: { ...validValue, dateLocal: 'invalid' } },
      { value: { ...validValue, occurredAt: 'invalid' } },
      {
        selectedProductRows: [{ ...validRows[0], qty: 0 }],
      },
    ];

    invalidCases.forEach((change) => {
      const result = buildInputDaySelectedItemsRequest(
        selectedItemsRequest(change),
      );
      expect(result.request).toBeNull();
      expect(result.error).toBeTruthy();
    });

    const withSlotKey = buildInputDaySelectedItemsRequest(
      selectedItemsRequest({
        value: { ...validValue, qtyUnit: null, slotKey: ' breakfast ' },
        selectedProductRows: [{ ...validRows[0], qtyUnit: null }],
      }),
    );
    expect(withSlotKey).toEqual({
      request: {
        requestDateLocal: '2026-02-16',
        payload: {
          items: [
            {
              productId: 7,
              inventoryId: 4,
              qty: 2,
              slotKey: 'breakfast',
            },
          ],
        },
      },
      error: null,
    });

    const withSlotIdAndOccurredAt = buildInputDaySelectedItemsRequest(
      selectedItemsRequest({
        selectedSlotId: 3,
        value: { ...validValue, occurredAt: '2026-02-16T08:00' },
      }),
    );
    expect(withSlotIdAndOccurredAt.request).toEqual(
      jasmine.objectContaining({
        payload: {
          items: [
            jasmine.objectContaining({
              slotId: 3,
              qtyUnit: 'g',
              occurredAt: jasmine.any(String),
            }),
          ],
        },
      }),
    );

    const invalidUnit = buildInputDaySelectedItemsRequest(
      selectedItemsRequest({
        selectedProductRows: [{ ...validRows[0], qtyUnit: 'invalid' as never }],
      }),
    );
    expect(invalidUnit.request).toBeNull();
    expect(invalidUnit.error).toContain('qtyUnit');
  });
});
