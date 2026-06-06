export interface FilterField<T> {
  key: string;
  label: string;
  description?: string;
  match: 'enum' | 'substring';
  get: (item: T) => string | null;
  values?: readonly string[];
  suggest?: boolean;
}
export interface FilterSchema<T> {
  fields: FilterField<T>[];
  text: (item: T) => string[];
}
export interface Clause {
  key: string | null;
  value: string;
}
const WS = /\s+/;
export function parseClauses(input: string, knownKeys: Set<string>): Clause[] {
  const out: Clause[] = [];
  for (const chunk of input.split(WS)) {
    if (!chunk) continue;
    const colon = chunk.indexOf(':');
    if (colon > 0) {
      const key = chunk.slice(0, colon).toLowerCase();
      const value = chunk.slice(colon + 1);
      if (knownKeys.has(key)) {
        if (value) out.push({
          key,
          value
        });
        continue;
      }
    }
    out.push({
      key: null,
      value: chunk
    });
  }
  return out;
}
export function compileMatcher<T>(input: string, schema: FilterSchema<T>): (item: T) => boolean {
  const fieldByKey = new Map(schema.fields.map(f => [f.key, f] as const));
  const clauses = parseClauses(input, new Set(fieldByKey.keys()));
  const bare: string[] = [];
  const byKey = new Map<string, string[]>();
  for (const c of clauses) {
    if (c.key == null) {
      bare.push(c.value.toLowerCase());
    } else {
      const arr = byKey.get(c.key);
      if (arr) arr.push(c.value.toLowerCase());else byKey.set(c.key, [c.value.toLowerCase()]);
    }
  }
  const keyed = [...byKey.entries()].map(([key, values]) => ({
    field: fieldByKey.get(key)!,
    values
  }));
  return (item: T) => {
    if (bare.length) {
      const hay = schema.text(item).join('\n').toLowerCase();
      for (const term of bare) if (!hay.includes(term)) return false;
    }
    for (const {
      field,
      values
    } of keyed) {
      const raw = field.get(item);
      const iv = raw == null ? '' : raw.toLowerCase();
      const ok = values.some(v => field.match === 'enum' ? iv === v : iv.includes(v));
      if (!ok) return false;
    }
    return true;
  };
}
export interface ActiveToken {
  start: number;
  end: number;
  word: string;
  key: string | null;
  partial: string;
  mode: 'key' | 'value';
}
export function activeTokenAt(text: string, caret: number, knownKeys: Set<string>): ActiveToken {
  let start = caret;
  let end = caret;
  while (start > 0 && !/\s/.test(text[start - 1])) start--;
  while (end < text.length && !/\s/.test(text[end])) end++;
  const word = text.slice(start, end);
  const colon = word.indexOf(':');
  if (colon > 0) {
    const key = word.slice(0, colon).toLowerCase();
    if (knownKeys.has(key)) {
      return {
        start,
        end,
        word,
        key,
        partial: word.slice(colon + 1),
        mode: 'value'
      };
    }
  }
  return {
    start,
    end,
    word,
    key: null,
    partial: word,
    mode: 'key'
  };
}
export interface Suggestion {
  value: string;
  hint?: string;
  kind: 'key' | 'value';
}
export function buildSuggestions<T>(active: ActiveToken, schema: FilterSchema<T>, items: T[], limit = 8): Suggestion[] {
  if (active.mode === 'key') {
    const p = active.partial.toLowerCase();
    return schema.fields.filter(f => f.key.startsWith(p)).slice(0, limit).map(f => ({
      value: f.key,
      hint: f.description ?? f.label,
      kind: 'key'
    }));
  }
  const field = schema.fields.find(f => f.key === active.key);
  if (!field || field.suggest === false) return [];
  const p = active.partial.toLowerCase();
  let pool: string[];
  if (field.values && field.values.length) {
    pool = [...field.values];
  } else {
    const seen = new Set<string>();
    for (const it of items) {
      const v = field.get(it);
      if (v) seen.add(v);
    }
    pool = [...seen].sort();
  }
  return pool.filter(v => v.toLowerCase().includes(p)).slice(0, limit).map(v => ({
    value: v,
    kind: 'value'
  }));
}
export function applySuggestion(text: string, active: ActiveToken, s: Suggestion): {
  text: string;
  caret: number;
} {
  const before = text.slice(0, active.start);
  if (s.kind === 'key') {
    const insert = `${s.value}:`;
    const after = text.slice(active.end);
    return {
      text: before + insert + after,
      caret: before.length + insert.length
    };
  }
  const insert = `${active.key}:${s.value} `;
  const after = text.slice(active.end).replace(/^\s+/, '');
  return {
    text: before + insert + after,
    caret: before.length + insert.length
  };
}
export function valuesForKey(input: string, key: string): string[] {
  return parseClauses(input, new Set([key])).filter(c => c.key === key).map(c => c.value);
}
export function setSingleValue(input: string, key: string, value: string | null): string {
  const kept = input.split(WS).filter(Boolean).filter(chunk => {
    const colon = chunk.indexOf(':');
    return colon <= 0 || chunk.slice(0, colon).toLowerCase() !== key;
  });
  if (value != null) kept.push(`${key}:${value}`);
  return kept.join(' ');
}
