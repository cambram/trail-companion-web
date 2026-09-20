import { Navigate, Route, Routes } from "react-router"

import { ProtectedRoute } from "@/auth/ProtectedRoute"
import LoginPage from "@/pages/LoginPage"
import NutritionPage from "@/pages/NutritionPage"
import RegisterPage from "@/pages/RegisterPage"
import RacePage from "@/pages/RacePage"
import RacesPage from "@/pages/RacesPage"

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RacesPage />} />
        <Route path="/races/:id" element={<RacePage />} />
        <Route path="/nutrition" element={<NutritionPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
