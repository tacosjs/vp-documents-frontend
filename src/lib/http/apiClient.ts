import { env } from '@/env'

export class ApiHttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiHttpError'
  }
}

function apiBase(): string {
  return env.VITE_API_BASE_URL.replace(/\/$/, '')
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    ...(init?.headers ?? {}),
  }

  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  })

  const text = await res.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text) as unknown
    } catch {
      body = null
    }
  }

  if (!res.ok) {
    const msg =
      body &&
      typeof body === 'object' &&
      'error' in body &&
      typeof (body).error === 'string'
        ? (body as { error: string }).error
        : res.statusText
    throw new ApiHttpError(res.status, msg)
  }

  return body as T
}

export async function apiVoid(path: string, init?: RequestInit): Promise<void> {
  await apiJson<unknown>(path, init)
}
