import { TONE_CLASSES, type Tone } from "@/lib/tone"
import { cn } from "@/lib/utils"

export type { Tone } from "@/lib/tone"

type Props = { ok?: boolean; tone?: Tone; children: React.ReactNode }

export function StatusPill({ ok = true, tone, children }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-[5px] text-xs font-bold whitespace-nowrap",
        TONE_CLASSES[tone ?? (ok ? "green" : "red")],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}
