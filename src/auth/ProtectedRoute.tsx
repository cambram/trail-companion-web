import { Navigate, Outlet } from "react-router"

import { useAuth } from "./AuthContext"

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  return user ? <Outlet /> : <Navigate to="/login" replace />
}
