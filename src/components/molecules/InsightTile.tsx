import { TONE_CLASSES, type Tone } from "@/lib/tone"
import { cn } from "@/lib/utils"

type Props = { tone?: Tone; label: string; value: string; children?: React.ReactNode }

/** A label, one big number, and a line of context. The label carries the tone, never the number. */
export function InsightTile({ tone = "muted", label, value, children }: Props) {
  return (
    <div className="min-w-0 rounded-xl bg-card px-3.5 py-3 shadow-card">
      <p className={cn("mb-1 inline-block rounded-full px-2 py-0.5 text-[0.6875rem] font-extrabold", TONE_CLASSES[tone])}>{label}</p>
      <p className="text-lg leading-tight font-extrabold tracking-[-0.01em]">{value}</p>
      {children && <p className="text-xs leading-snug text-muted-foreground">{children}</p>}
    </div>
  )
}
