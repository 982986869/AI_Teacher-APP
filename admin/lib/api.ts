// Thin fetch wrapper for the admin API. Requests go to /api/admin/* which Next proxies
// to the Express backend (next.config.mjs), so everything stays same-origin. The JWT is
// stored in localStorage and attached as a Bearer token.

const TOKEN_KEY = 'ailernova_admin_token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token)
}
export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

type Options = {
  method?: string
  body?: unknown
  params?: Record<string, string | number | undefined | null>
}

// Registered by the auth layer so a 401 anywhere kicks the admin back to /login.
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(fn: () => void) { onUnauthorized = fn }

export async function api<T = any>(path: string, opts: Options = {}): Promise<T> {
  const { method = 'GET', body, params } = opts
  let url = `/api/admin${path}`
  if (params) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
    }
    const s = qs.toString()
    if (s) url += `?${s}`
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
  } catch {
    throw new ApiError('Network error — check your connection and the backend server.', 0)
  }

  if (res.status === 401) {
    clearToken()
    if (onUnauthorized) onUnauthorized()
    throw new ApiError('Your session has expired. Please sign in again.', 401)
  }

  let json: any = null
  try { json = await res.json() } catch { /* empty body */ }

  if (!res.ok || (json && json.success === false)) {
    const msg = (json && (json.error || json.message)) || `Request failed (${res.status})`
    throw new ApiError(msg, res.status)
  }
  return (json ? json.data : null) as T
}
