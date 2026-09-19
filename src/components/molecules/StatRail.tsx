import { pct } from "@/lib/planMath"
import { cn } from "@/lib/utils"

type Props = { planned: number; need: number; inverse?: boolean; children?: React.ReactNode }

/** Progress bar with a caption row. `inverse` for the black hero card. */
export function StatRail({ planned, need, inverse, children }: Props) {
  return (
    <div>
      <div className={cn("h-1.5 overflow-hidden rounded-full", inverse ? "bg-primary-foreground/20" : "bg-secondary")}>
        <div
          className={cn("h-full rounded-full transition-[width]", inverse ? "bg-primary-foreground" : "bg-primary")}
          style={{ width: `${pct(planned, need)}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2.5 text-[0.8125rem] font-semibold">{children}</div>
    </div>
  )
}
