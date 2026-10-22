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

async function request<T>(base: string, path: string, opts: Options = {}): Promise<T> {
  const { method = 'GET', body, params } = opts
  let url = `${base}${path}`
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
  const hadToken = !!token

  let res: Response
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
  } catch {
    throw new ApiError('Network error — check your connection and the backend server.', 0)
  }

  let json: any = null
  try { json = await res.json() } catch { /* empty body */ }

  // A 401 only means "expired" if we actually sent a token. Signing in with the
  // wrong password is also a 401, and reporting that as an expired session told
  // the user to sign in again on the very screen they were signing in from.
  if (res.status === 401) {
    if (!hadToken) {
      throw new ApiError((json && (json.error || json.message)) || 'Invalid email or password.', 401)
    }
    clearToken()
    if (onUnauthorized) onUnauthorized()
    throw new ApiError('Your session has expired. Please sign in again.', 401)
  }

  if (!res.ok || (json && json.success === false)) {
    const msg = (json && (json.error || json.message)) || `Request failed (${res.status})`
    throw new ApiError(msg, res.status)
  }
  return (json ? json.data : null) as T
}

// Multipart upload with progress. Kept separate from api() rather than folded into
// it: fetch cannot report upload progress at all, so a large PDF would sit at 0%
// with no way to tell a stalled connection from a slow one. XHR can.
export function upload<T = any>(
  path: string,
  form: FormData,
  onProgress?: (pct: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/admin${path}`)
    const token = getToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    // Content-Type is deliberately NOT set — the browser must add the multipart
    // boundary itself, and setting it by hand strips that and breaks the parse.
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      let json: any = null
      try { json = JSON.parse(xhr.responseText) } catch { /* empty or non-JSON body */ }
      if (xhr.status === 401) { clearToken(); if (onUnauthorized) onUnauthorized() }
      if (xhr.status >= 200 && xhr.status < 300 && !(json && json.success === false)) {
        resolve((json ? json.data : null) as T)
      } else {
        reject(new ApiError((json && (json.error || json.message)) || `Upload failed (${xhr.status})`, xhr.status))
      }
    }
    xhr.onerror = () => reject(new ApiError('Network error during upload.', 0))
    xhr.ontimeout = () => reject(new ApiError('The upload timed out.', 0))
    xhr.send(form)
  })
}

export function api<T = any>(path: string, opts: Options = {}): Promise<T> {
  return request<T>('/api/admin', path, opts)
}
