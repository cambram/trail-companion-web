import { ChevronLeft } from "lucide-react"
import { Link } from "react-router"

type Props = { to: string; label: string; title: string; children?: React.ReactNode }

/** Round back link, centred title, optional 42px action on the right. */
export function BackHeader({ to, label, title, children }: Props) {
  return (
    <header className="flex items-center gap-3 pt-3 pb-[18px]">
      <Link
        to={to}
        aria-label={label}
        className="grid size-[42px] flex-none place-items-center rounded-full bg-card shadow-card"
      >
        <ChevronLeft className="size-5" aria-hidden />
      </Link>
      <div className="flex-1 text-center font-extrabold">{title}</div>
      {children ?? <span className="size-[42px]" />}
    </header>
  )
}
