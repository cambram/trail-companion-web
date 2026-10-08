import { Navigate, Outlet, useLocation } from "react-router"

import { useAuth } from "./AuthContext"

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return null
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />
}
