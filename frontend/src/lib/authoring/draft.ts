import type { DraftSnapshot } from './types';
const NEW_DRAFT_KEY = 'workflow:new:draft';
export interface StoredDraft {
  savedAt: string;
  snapshot: DraftSnapshot;
}
function hasContent(s: DraftSnapshot): boolean {
  return s.tasks.length > 0 || s.namespace.trim() !== '' || s.key.trim() !== '';
}
export function readDraft(): StoredDraft | null {
  try {
    const raw = localStorage.getItem(NEW_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    if (!parsed?.snapshot || !Array.isArray(parsed.snapshot.tasks)) return null;
    if (!hasContent(parsed.snapshot)) return null;
    return parsed;
  } catch {
    return null;
  }
}
export function writeDraft(snapshot: DraftSnapshot): void {
  try {
    if (!hasContent(snapshot)) {
      localStorage.removeItem(NEW_DRAFT_KEY);
      return;
    }
    const payload: StoredDraft = {
      savedAt: new Date().toISOString(),
      snapshot
    };
    localStorage.setItem(NEW_DRAFT_KEY, JSON.stringify(payload));
  } catch {}
}
export function clearDraft(): void {
  try {
    localStorage.removeItem(NEW_DRAFT_KEY);
  } catch {}
}
