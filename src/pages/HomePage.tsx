import { useAuth } from "@/auth/AuthContext"
import { Greeting } from "@/components/organisms/Greeting"

export default function HomePage() {
  const { user, logout } = useAuth()
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <Greeting name={user!.email} onLogout={logout} />
    </main>
  )
}
