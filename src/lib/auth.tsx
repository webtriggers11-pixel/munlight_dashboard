import {
  createContext,
  use,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { clearToken, setToken } from "@/lib/api"
import { config } from "@/constants/config"
import { adminLogin } from "@/services/auth"
import type { User } from "@/types/user"

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(config.storage.userKey)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser())

  const login = useCallback(async (email: string, password: string) => {
    const result = await adminLogin({ email, password })
    setToken(result.access_token)
    localStorage.setItem(config.storage.userKey, JSON.stringify(result.user))
    setUser(result.user)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    localStorage.removeItem(config.storage.userKey)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, login, logout }),
    [user, login, logout]
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
