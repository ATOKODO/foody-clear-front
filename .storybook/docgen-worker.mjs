// Scoped polling adapter for angular-vite 10.6.1's preview docgen integration.
// Its default recursive fs.watch includes node_modules and build/test artifacts,
// even though those events are ignored afterwards. Do not modify installed packages.
import { readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { ComponentMetaManager } from 'storybook/internal/component-meta';
import { createDocgenProvider } from '@storybook/angular-vite/internal/docgen-worker';

const folders = ['src', 'stories', 'tests/mocks', '.storybook'];
const timers = new WeakMap();

export function sourceSnapshot(root = process.cwd()) {
  const files = new Map();
  const inspect = file => {
    if (!/\.(?:ts|json)$/.test(file)) return;
    const stat = statSync(file, { throwIfNoEntry: false });
    if (stat?.isFile()) files.set(file, `${stat.mtimeMs}:${stat.size}`);
  };
  const visit = directory => {
    if (!statSync(directory, { throwIfNoEntry: false })?.isDirectory()) return;
    for (const item of readdirSync(directory, { withFileTypes: true })) {
      const file = join(directory, item.name);
      if (item.isDirectory() && item.name !== 'node_modules' && !item.name.startsWith('.')) visit(file);
      else if (item.isFile()) inspect(file);
    }
  };
  for (const folder of folders) visit(resolve(root, folder));
  for (const name of readdirSync(root)) if (/^tsconfig.*\.json$/.test(name)) inspect(resolve(root, name));
  return files;
}

export function snapshotChanges(previous, current) {
  const changes = [];
  for (const [filePath, signature] of current) {
    if (previous.get(filePath) !== signature) changes.push({ filePath, type: previous.has(filePath) ? 'changed' : 'created' });
  }
  for (const filePath of previous.keys()) if (!current.has(filePath)) changes.push({ filePath, type: 'deleted' });
  return changes;
}

// Override only public lifecycle hooks, in Storybook's isolated worker process.
// Keep the official Angular analyzer, source snippets and API extraction intact.
ComponentMetaManager.prototype.startWatching = function () {
  if (timers.has(this)) return;
  let previous = sourceSnapshot();
  const timer = setInterval(() => {
    try {
      const current = sourceSnapshot();
      const changes = snapshotChanges(previous, current);
      previous = current;
      for (const { filePath, type } of changes) if (/[/\\]tsconfig[^/\\]*\.json$/.test(filePath)) this.onConfigChanged(filePath, type);
      if (changes.length) this.onFilesChanged(changes);
    } catch (error) {
      // Atomic directory saves can temporarily disappear; retry on the next tick.
      if (error.code !== 'ENOENT') console.warn('[storybook-docgen] Source polling failed:', error.message);
    }
  }, 1000);
  timer.unref();
  timers.set(this, timer);
};
const stopWatching = ComponentMetaManager.prototype.stopWatching;
ComponentMetaManager.prototype.stopWatching = function () {
  clearInterval(timers.get(this));
  timers.delete(this);
  stopWatching.call(this);
};

export { createDocgenProvider };
