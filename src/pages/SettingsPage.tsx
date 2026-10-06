import { ChevronLeft } from "lucide-react"
import { RadioGroup } from "radix-ui"
import { useState } from "react"
import { Link, useNavigate } from "react-router"

import { AppFrame } from "@/components/atoms/AppFrame"
import { ErrorText } from "@/components/atoms/ErrorText"
import { FormField } from "@/components/molecules/FormField"
import { Button } from "@/components/ui/button"
import { Card, CardTitle } from "@/components/ui/card"
import { accountError, useProfile } from "@/hooks/useProfile"

const THEMES = ["System", "Light", "Dark"] as const
type Theme = (typeof THEMES)[number]

// index.html applies the stored theme before first paint. System = no attribute, so the OS media query keeps working.
function readTheme(): Theme {
  try {
    const t = localStorage.getItem("theme")
    return t === "light" ? "Light" : t === "dark" ? "Dark" : "System"
  } catch {
    return "System"
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  try {
    if (theme === "System") {
      delete root.dataset.theme
      localStorage.removeItem("theme")
    } else {
      root.dataset.theme = theme.toLowerCase()
      localStorage.setItem("theme", theme.toLowerCase())
    }
  } catch {
    // storage unavailable: theme applies for this visit only
  }
}

const Note = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[0.8125rem] text-muted-foreground">{children}</p>
)

/** Runs an async form action with pending, error and done state. */
function useAction(fallback: string) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()
  const [done, setDone] = useState(false)
  const run = async (action: () => Promise<unknown>) => {
    setPending(true)
    setError(undefined)
    setDone(false)
    try {
      await action()
      setDone(true)
    } catch (e) {
      setError(accountError(e, fallback))
    } finally {
      setPending(false)
    }
  }
  return { pending, error, setError, done, run }
}

export default function SettingsPage() {
  const { user, saveName, changePassword, deleteAccount, logout } = useProfile()
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState(user.firstName ?? "")
  const [lastName, setLastName] = useState(user.lastName ?? "")
  const name = useAction("Could not save your name")

  const [theme, setTheme] = useState(readTheme)

  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const password = useAction("Could not change your password")

  const [typedUsername, setTypedUsername] = useState("")
  const [deletePassword, setDeletePassword] = useState("")
  const removal = useAction("Could not delete your account")
  const canDelete = typedUsername.trim().toLowerCase() === user.username && deletePassword.length > 0

  return (
    <AppFrame>
      <header className="flex items-center gap-3 pt-3 pb-[18px]">
        <Link
          to="/"
          aria-label="Back to races"
          className="grid size-[42px] flex-none place-items-center rounded-full bg-card shadow-card"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <div className="flex-1 text-center font-extrabold">Settings</div>
        <span className="size-[42px]" />
      </header>

      <div className="grid gap-3.5">
        <Card>
          <CardTitle>Account</CardTitle>
          <dl className="grid gap-2 text-[0.8125rem]">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Username</dt>
              <dd className="min-w-0 truncate font-semibold">{user.username}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Member since</dt>
              <dd className="font-semibold">
                {new Date(user.createdAtUtc).toLocaleDateString(undefined, { dateStyle: "long" })}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardTitle>Your name</CardTitle>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              name.run(() => saveName(firstName, lastName))
            }}
          >
            <FormField
              label="First name"
              autoComplete="given-name"
              maxLength={100}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <FormField
              label="Last name"
              autoComplete="family-name"
              maxLength={100}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            {name.error && <ErrorText>{name.error}</ErrorText>}
            {name.done && <Note>Saved</Note>}
            <Button type="submit" variant="secondary" block disabled={name.pending}>
              {name.pending ? "Saving..." : "Save name"}
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Appearance</CardTitle>
          <RadioGroup.Root
            value={theme}
            onValueChange={(v) => {
              setTheme(v as Theme)
              applyTheme(v as Theme)
            }}
            aria-label="Theme"
            className="grid grid-cols-3 gap-2"
          >
            {THEMES.map((t) => (
              <RadioGroup.Item
                key={t}
                value={t}
                className="min-h-10 rounded-full bg-secondary text-[0.8125rem] font-bold text-secondary-foreground outline-none data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              >
                {t}
              </RadioGroup.Item>
            ))}
          </RadioGroup.Root>
        </Card>

        <Card>
          <CardTitle>Password</CardTitle>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (next !== confirm) return password.setError("New passwords do not match")
              password.run(async () => {
                await changePassword(current, next)
                setCurrent("")
                setNext("")
                setConfirm("")
              })
            }}
          >
            <FormField
              label="Current password"
              type="password"
              autoComplete="current-password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
            <FormField
              label="New password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            <FormField
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {password.error && <ErrorText>{password.error}</ErrorText>}
            {password.done && <Note>Password changed. Other devices will need to log in again.</Note>}
            <Button type="submit" variant="secondary" block disabled={password.pending}>
              {password.pending ? "Changing..." : "Change password"}
            </Button>
          </form>
        </Card>

        <Button variant="secondary" block onClick={() => logout()}>
          Log out
        </Button>

        <Card className="mt-6">
          <CardTitle className="text-red">Danger zone</CardTitle>
          <Note>
            Deleting your account permanently removes your races and nutrition library. This cannot be undone.
          </Note>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              removal.run(async () => {
                await deleteAccount(deletePassword)
                navigate("/login", { replace: true, state: { notice: "Your account has been deleted." } })
              })
            }}
          >
            <FormField
              label={`Type ${user.username} to confirm`}
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={typedUsername}
              onChange={(e) => setTypedUsername(e.target.value)}
            />
            <FormField
              label="Password"
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
            {removal.error && <ErrorText>{removal.error}</ErrorText>}
            <Button type="submit" block className="bg-red-soft text-red" disabled={!canDelete || removal.pending}>
              {removal.pending ? "Deleting..." : "Delete account"}
            </Button>
          </form>
        </Card>
      </div>
    </AppFrame>
  )
}
