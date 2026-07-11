export interface IdentifiableListItem {
  id: string;
}

export function createSelection<T extends IdentifiableListItem>(
  items: T[],
  selectedIds: string[] | null,
  singleSelection: boolean,
): Set<string> {
  const availableIds = new Set(items.map((item) => item.id));
  const selection = new Set((selectedIds ?? []).filter((id) => availableIds.has(id)));

  if (singleSelection && selection.size > 1) {
    const firstSelected = items.find((item) => selection.has(item.id));
    selection.clear();
    if (firstSelected) {
      selection.add(firstSelected.id);
    }
  }

  return selection;
}

export function selectItem(selection: Set<string>, id: string): void {
  selection.add(id);
}

export function deselectItem(selection: Set<string>, id: string): void {
  selection.delete(id);
}

export function getSelectedItems<T extends IdentifiableListItem>(
  items: T[],
  selection: Set<string>,
): T[] {
  return items.filter((item) => selection.has(item.id));
}

export function isSelectionDisabled(
  multiSelection: boolean,
  selected: boolean,
  selectionSize: number,
  maxSelections: number | null,
): boolean {
  return multiSelection && !selected && maxSelections !== null && selectionSize >= maxSelections;
}
