import { Navigate, Route, Routes } from "react-router"

import { ProtectedRoute } from "@/auth/ProtectedRoute"
import JoinPage from "@/pages/JoinPage"
import LoginPage from "@/pages/LoginPage"
import NutritionPage from "@/pages/NutritionPage"
import RegisterPage from "@/pages/RegisterPage"
import RacePage from "@/pages/RacePage"
import RacesPage from "@/pages/RacesPage"
import SettingsPage from "@/pages/SettingsPage"

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RacesPage />} />
        <Route path="/races/:id" element={<RacePage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/join/:pin" element={<JoinPage />} />
        <Route path="/nutrition" element={<NutritionPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
