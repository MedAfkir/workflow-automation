const STORAGE_KEY = 'wf.secrets.recent-namespaces';
const MAX = 8;
export function readRecentNamespaces(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
export function rememberNamespace(ns: string): void {
  try {
    const next = [ns, ...readRecentNamespaces().filter(n => n !== ns)].slice(0, MAX);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}
