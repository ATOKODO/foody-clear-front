import {
  createSelection,
  deselectItem,
  getSelectedItems,
  isSelectionDisabled,
  selectItem,
} from './list-selection';

describe('list-selection', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('creates single and multi selections from available ids', () => {
    expect(createSelection(items, ['b', 'missing'], false)).toEqual(new Set(['b']));
    expect(createSelection(items, ['c', 'a'], true)).toEqual(new Set(['a']));
    expect(createSelection(items, null, true)).toEqual(new Set());
    expect(createSelection([], ['a'], true)).toEqual(new Set());
  });

  it('mutates selections and resolves selected items', () => {
    const selection = new Set<string>();
    selectItem(selection, 'a');
    selectItem(selection, 'b');
    expect(getSelectedItems(items, selection)).toEqual([{ id: 'a' }, { id: 'b' }]);
    deselectItem(selection, 'a');
    expect(getSelectedItems(items, selection)).toEqual([{ id: 'b' }]);
  });

  it('computes max-selection disabled state', () => {
    expect(isSelectionDisabled(true, false, 2, 2)).toBeTrue();
    expect(isSelectionDisabled(true, true, 2, 2)).toBeFalse();
    expect(isSelectionDisabled(false, false, 10, 2)).toBeFalse();
    expect(isSelectionDisabled(true, false, 2, null)).toBeFalse();
  });
});
