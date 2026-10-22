import { DEMO_MODE } from '@/shared/lib/env';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | null,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions {
  signal?: AbortSignal;
  ifNoneMatch?: string;
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function apiGet<T>(path: string, opts: RequestOptions = {}): Promise<T | null> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.ifNoneMatch) headers['If-None-Match'] = opts.ifNoneMatch;
  const res = await fetch(path, { method: 'GET', headers, signal: opts.signal });
  if (res.status === 304) return null;
  if (!res.ok) throw await readError(res);
  if (res.status === 204) return null;
  return (await res.json()) as T;
}

export async function apiPost<TResponse, TBody = unknown>(
  path: string,
  body: TBody,
  opts: RequestOptions = {},
): Promise<TResponse> {
  return sendJson<TResponse>('POST', path, body, opts);
}

export async function apiPut<TResponse, TBody = unknown>(
  path: string,
  body: TBody,
  opts: RequestOptions = {},
): Promise<TResponse> {
  return sendJson<TResponse>('PUT', path, body, opts);
}

export async function apiDelete(path: string, opts: RequestOptions = {}): Promise<void> {
  assertWritable();
  const res = await fetch(path, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    signal: opts.signal,
  });
  if (!res.ok) throw await readError(res);
}

async function sendJson<TResponse>(
  method: 'POST' | 'PUT',
  path: string,
  body: unknown,
  opts: RequestOptions,
): Promise<TResponse> {
  assertWritable();
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    signal: opts.signal,
  });
  if (!res.ok) throw await readError(res);
  return (await res.json()) as TResponse;
}

function assertWritable() {
  if (DEMO_MODE) throw new ApiError(503, 'DEMO_MODE', 'Demo mode is read-only.');
}

async function readError(res: Response): Promise<ApiError> {
  const body = (await res.json().catch(() => null)) as { code?: string; message?: string } | null;
  return new ApiError(res.status, body?.code ?? null, body?.message ?? `HTTP ${res.status}`);
}
