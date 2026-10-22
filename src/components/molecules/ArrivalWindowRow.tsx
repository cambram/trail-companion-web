import { arrivalWindow, ARRIVAL_WINDOW } from "@/lib/planInsights"
import { clockToMin, fmtClock } from "@/lib/planMath"
import { cn } from "@/lib/utils"

/** Early, planned and late arrival clocks. AidStationCard carries the same markup inline and could adopt this later. */
export function ArrivalWindowRow({ plannedMin, startTime }: { plannedMin: number; startTime: string }) {
  const w = arrivalWindow(plannedMin)
  const base = clockToMin(startTime)
  const pct = Math.round(ARRIVAL_WINDOW * 100)
  const cells: [string, number][] = [[`Early −${pct}%`, w.early], ["Planned", w.planned], [`Late +${pct}%`, w.late]]
  return (
    <div className="grid grid-cols-3 overflow-hidden rounded-xl bg-violet-soft text-center">
      {cells.map(([label, min], i) => (
        <div key={label} className={cn("px-3 py-2.5", i === 1 && "bg-violet text-card")}>
          <span className="block text-[0.6875rem] font-semibold">{label}</span>
          <b className="tabular-nums">{fmtClock(base + min)}</b>
        </div>
      ))}
    </div>
  )
}
