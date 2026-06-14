import { Navigate, Outlet, useLocation } from "react-router-dom"

import { getToken } from "@/lib/api"
import { useAuth } from "@/lib/auth"

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  // Require both a stored user and a token.
  if (!isAuthenticated || !getToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
