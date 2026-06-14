import axios, { type AxiosInstance } from "axios"

// Single API base URL, read from env (must include the /api prefix).
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"

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
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
})

// Attach the admin JWT to every request.
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401 the token is stale/invalid — clear it and bounce to login.
// We avoid importing the router here; a hard redirect is simplest and safe.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
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
