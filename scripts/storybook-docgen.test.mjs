import assert from 'node:assert/strict';
import test from 'node:test';
import { sourceSnapshot, snapshotChanges } from '../.storybook/docgen-worker.mjs';

test('docgen polling watches sources, not installed packages or generated artifacts', () => {
  const files = [...sourceSnapshot().keys()];
  assert(files.some(file => file.endsWith('/src/app/app.ts')));
  assert(files.some(file => file.endsWith('/stories/components/ProductForm.stories.ts')));
  assert(files.some(file => file.endsWith('/tsconfig.json')));
  assert(files.every(file => !/\/(?:node_modules|dist|test-results|playwright-report)\//.test(file)));
});

test('docgen polling reports the public manager file-change contract', () => {
  const previous = new Map([['/changed.ts', '1'], ['/deleted.ts', '1'], ['/unchanged.ts', '1']]);
  const current = new Map([['/changed.ts', '2'], ['/created.ts', '1'], ['/unchanged.ts', '1']]);
  assert.deepEqual(snapshotChanges(previous, current), [
    { filePath: '/changed.ts', type: 'changed' },
    { filePath: '/created.ts', type: 'created' },
    { filePath: '/deleted.ts', type: 'deleted' },
  ]);
});
