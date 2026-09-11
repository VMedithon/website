import { useAuth } from '@clerk/react';
import { useMemo } from 'react';

export const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
async function readError(response: Response): Promise<never> {
  const body = (await response.json().catch(() => null)) as {
    error?: { message?: string };
    errors?: string[];
  } | null;
  throw new ApiError(
    body?.error?.message || body?.errors?.join('\n') || `The request failed (${response.status}).`,
    response.status,
  );
}
export type Api = ReturnType<typeof createApi>;
export function createApi(getToken: () => Promise<string | null>) {
  async function send(path: string, init: RequestInit = {}) {
    if (!apiBase)
      throw new ApiError('The event portal is not available yet. Please try again later.', 503);
    const token = await getToken();
    if (!token) throw new ApiError('Please sign in again.', 401);
    const response = await fetch(`${apiBase}/api/v1${path}`, {
      ...init,
      cache: 'no-store',
      credentials: 'omit',
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    });
    if (!response.ok) await readError(response);
    return response;
  }
  return {
    async get<T>(path: string, signal?: AbortSignal): Promise<T> {
      return (await send(path, signal ? { signal } : {})).json();
    },
    async mutate<T>(
      path: string,
      method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      body?: unknown,
    ): Promise<T> {
      return (
        await send(path, {
          method,
          ...(body === undefined
            ? {}
            : { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }),
        })
      ).json();
    },
    async upload<T>(path: string, data: FormData): Promise<T> {
      return (await send(path, { method: 'POST', body: data })).json();
    },
    async download(path: string, filename: string) {
      const response = await send(path);
      saveDownload(await response.blob(), filename);
    },
  };
}
export function useApi(): Api {
  const { getToken } = useAuth();
  return useMemo(() => createApi(getToken), [getToken]);
}
export function saveDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function getPublic<T>(path: string, signal?: AbortSignal): Promise<T> {
  if (!apiBase) throw new ApiError('Event updates will be available here soon.', 503);
  const response = await fetch(`${apiBase}/api/v1/public${path}`, {
    cache: 'no-store',
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) await readError(response);
  return response.json();
}
