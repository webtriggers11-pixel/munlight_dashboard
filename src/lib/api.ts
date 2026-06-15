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

// Silent refresh: on 401 try /auth/refresh once using the httpOnly cookie.
// If successful, retry the original request with the new access token.
// If it fails, clear local state and redirect to login.
let _refreshing: Promise<string | null> | null = null

async function _doRefresh(): Promise<string | null> {
  try {
    const resp = await axios.post(
      `${API_ROOT}/api/auth/refresh`,
      null,
      { withCredentials: true }
    )
    const token: string = resp.data?.data?.access_token
    if (token) {
      setToken(token)
      const user = resp.data?.data?.user
      if (user) localStorage.setItem("munlight_admin_user", JSON.stringify(user))
    }
    return token ?? null
  } catch {
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isAuthEndpoint = error.config?.url?.includes("/auth/")
    const isRefreshRetry = error.config?._refreshRetry

    if (error.response?.status === 401 && !isAuthEndpoint && !isRefreshRetry) {
      if (!_refreshing) {
        _refreshing = _doRefresh().finally(() => { _refreshing = null })
      }
      const newToken = await _refreshing

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
