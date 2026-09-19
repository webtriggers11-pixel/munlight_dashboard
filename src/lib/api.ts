import axios, { type AxiosInstance } from "axios"

// API base — must be the API root (without /api prefix; added per-request)
const API_ROOT =
  (import.meta.env.VITE_API_URL ?? "http://localhost:8000/api").replace(/\/api$/, "")

export const API_BASE_URL = `${API_ROOT}/api`

const TOKEN_KEY = "munlight_admin_token"

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export const api: AxiosInstance = axios.create({
  baseURL        : API_BASE_URL,
  headers        : { "Content-Type": "application/json" },
  withCredentials: true,   // send the httpOnly refresh-token cookie cross-origin
})

// Attach the short-lived admin access token to every request
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function isTokenExpired(token: string | null): boolean {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

// Silent refresh: the access token lives 15 minutes; the httpOnly refresh cookie
// (30 days) mints a new one. The server rotates that cookie on every use, so two
// refreshes at once — two dashboard tabs — would make the second one fail and
// sign the admin out. Callers in this tab share one request, and tabs take turns
// (Web Locks), reusing a token a sibling tab has just obtained.
let _inFlight: Promise<string | null> | null = null

// Resolves to a fresh token, or null when the session is really over (refresh
// cookie missing, expired or revoked). Throws on a network/server error — that
// must NOT sign the admin out.
function refreshSession(staleToken: string | null): Promise<string | null> {
  if (!_inFlight) {
    _inFlight = _refreshAcrossTabs(staleToken).finally(() => { _inFlight = null })
  }
  return _inFlight
}

async function _refreshAcrossTabs(staleToken: string | null): Promise<string | null> {
  const run = async (): Promise<string | null> => {
    const current = getToken()
    if (current && current !== staleToken && !isTokenExpired(current)) return current

    try {
      const resp = await axios.post(
        `${API_ROOT}/api/auth/refresh`,
        null,
        { withCredentials: true }
      )
      const token: string | undefined = resp.data?.data?.access_token
      if (!token) return null
      setToken(token)
      const user = resp.data?.data?.user
      if (user) localStorage.setItem("munlight_admin_user", JSON.stringify(user))
      return token
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) return null
      throw err
    }
  }

  return "locks" in navigator
    ? navigator.locks.request("munlight-admin-refresh", run)
    : run()
}

// On 401: renew the session once and retry the original request. Only a dead
// session clears local state and goes to the login page.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isAuthEndpoint = error.config?.url?.includes("/auth/")
    const isRefreshRetry = error.config?._refreshRetry

    if (error.response?.status === 401 && !isAuthEndpoint && !isRefreshRetry) {
      const rejectedToken =
        String(error.config?.headers?.Authorization ?? "").replace(/^Bearer\s+/i, "") || null

      let newToken: string | null
      try {
        newToken = await refreshSession(rejectedToken)
      } catch {
        return Promise.reject(error)
      }

      if (newToken) {
        error.config._refreshRetry = true
        error.config.headers.Authorization = `Bearer ${newToken}`
        return api(error.config)
      }

      // Refresh failed — wipe local state and go to login
      clearToken()
      localStorage.removeItem("munlight_admin_user")
      if (window.location.pathname !== "/login") {
        window.location.assign("/login")
      }
    }

    return Promise.reject(error)
  }
)

// Pull a human-readable message out of an axios error.
export function apiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === "string") return detail
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
    const message = error.response?.data?.message
    if (typeof message === "string") return message
    return error.message
  }
  return fallback
}
