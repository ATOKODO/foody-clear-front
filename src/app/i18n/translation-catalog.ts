import { MESSAGES } from './messages';

type Message = (typeof MESSAGES)[string];
interface ResolvedMessage {
  entry: Message;
  source: string;
  parameters: Readonly<Record<string, string>>;
}

const aliases = new Map<string, ResolvedMessage>();
const patterns: { expression: RegExp; names: string[]; message: ResolvedMessage; weight: number }[] = [];
const cache = new Map<string, ResolvedMessage | null>();

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

for (const [source, entry] of Object.entries(MESSAGES)) {
  const message: ResolvedMessage = { entry, source, parameters: {} };
  const variants: readonly string[] = [source, ...(typeof entry === 'string' ? [entry] : entry)];
  for (const variant of variants) {
    aliases.set(normalize(variant), message);
    const names = [...variant.matchAll(/\{([a-zA-Z]\w*)\}/g)].map((match) => match[1]);
    if (!names.length) continue;
    const literals = variant.split(/\{[a-zA-Z]\w*\}/g);
    // Never match arbitrary names or adjacent, ambiguous parameter values.
    const weight = literals.join('').replace(/[^a-zA-ZÀ-ÿ]/g, '').length;
    if (weight < 4 || literals.slice(1, -1).some((part) => part === '')) continue;
    const expression = literals.map((part) =>
      part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'),
    ).join('([\\s\\S]*?)');
    patterns.push({ expression: new RegExp(`^${expression}$`), names, message, weight });
  }
}
patterns.sort((left, right) => right.weight - left.weight);

/** Only call for application-owned UI messages, never for user names or raw JSON. */
export function resolveCatalogMessage(value: string): ResolvedMessage | null {
  const normalized = normalize(value);
  const entry = Object.hasOwn(MESSAGES, normalized) ? MESSAGES[normalized] : undefined;
  if (entry !== undefined) return { entry, source: normalized, parameters: {} };
  const alias = aliases.get(normalized);
  if (alias) return alias;
  const trimmed = value.trim();
  if (cache.has(trimmed)) return cache.get(trimmed) ?? null;
  let resolved: ResolvedMessage | null = null;
  if (trimmed.length <= 8192) {
    for (const pattern of patterns) {
      const match = pattern.expression.exec(trimmed);
      if (!match) continue;
      resolved = {
        ...pattern.message,
        parameters: Object.fromEntries(pattern.names.map((name, index) => [name, match[index + 1]])),
      };
      break;
    }
  }
  if (cache.size >= 500) cache.clear();
  cache.set(trimmed, resolved);
  return resolved;
}
