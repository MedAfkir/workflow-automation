export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string | null, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
export interface RequestOptions {
  signal?: AbortSignal;
  ifNoneMatch?: string;
}
export async function apiGet<T>(path: string, opts: RequestOptions = {}): Promise<T | null> {
  const headers: HeadersInit = {
    Accept: 'application/json'
  };
  if (opts.ifNoneMatch) headers['If-None-Match'] = opts.ifNoneMatch;
  const res = await fetch(path, {
    method: 'GET',
    headers,
    signal: opts.signal
  });
  if (res.status === 304) return null;
  if (!res.ok) throw await readError(res);
  if (res.status === 204) return null as unknown as T;
  return (await res.json()) as T;
}
export async function apiPost<TResponse, TBody = unknown>(path: string, body: TBody, opts: RequestOptions = {}): Promise<TResponse> {
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(body),
    signal: opts.signal
  });
  if (!res.ok) throw await readError(res);
  return (await res.json()) as TResponse;
}
export async function apiPut<TResponse, TBody = unknown>(path: string, body: TBody, opts: RequestOptions = {}): Promise<TResponse> {
  const res = await fetch(path, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(body),
    signal: opts.signal
  });
  if (!res.ok) throw await readError(res);
  return (await res.json()) as TResponse;
}
export async function apiDelete(path: string, opts: RequestOptions = {}): Promise<void> {
  const res = await fetch(path, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json'
    },
    signal: opts.signal
  });
  if (!res.ok) throw await readError(res);
}
async function readError(res: Response): Promise<ApiError> {
  let code: string | null = null;
  let message = `HTTP ${res.status}`;
  try {
    const body = (await res.json()) as {
      code?: string;
      message?: string;
    };
    if (body.code) code = body.code;
    if (body.message) message = body.message;
  } catch {}
  return new ApiError(res.status, code, message);
}
