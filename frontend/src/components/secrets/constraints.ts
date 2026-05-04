export const NAMESPACE_PATTERN = /^[a-z0-9][a-z0-9_.-]{0,63}$/;
export const NAMESPACE_HINT = 'lowercase, starts alphanumeric, at most 64 chars';
export const KEY_MAX = 128;
export const VALUE_MAX = 4096;
export function namespaceError(ns: string): string | null {
  if (!ns) return 'Namespace is required';
  if (!NAMESPACE_PATTERN.test(ns)) return `Namespace must be ${NAMESPACE_HINT}`;
  return null;
}
export function keyError(key: string): string | null {
  if (!key) return 'Key is required';
  if (key.length > KEY_MAX) return `Key must be at most ${KEY_MAX} characters`;
  return null;
}
export function valueError(value: string): string | null {
  if (!value) return 'Value is required';
  if (value.length > VALUE_MAX) return `Value must be at most ${VALUE_MAX} characters`;
  return null;
}
