import { Navigate, Outlet } from "react-router-dom"

import { useAuth } from "@/lib/auth"

// Guards routes that only a super admin may access. A regular admin who lands
// here (e.g. via a bookmarked URL) is redirected to the dashboard. The backend
// enforces the same restriction — this is just to keep the UI honest.
export function SuperAdminRoute() {
  const { user } = useAuth()

  if (user?.role !== "super_admin") {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
