import type { AuditEvent } from "@/lib/planInsights"
import { carbsOf, fmtDur, fmtKm } from "@/lib/planMath"
import { fmtSigned, REMINDER_STATE_TEXT, timeLabel } from "@/lib/printPlan"
import type { RaceDetail } from "@/lib/racesApi"

const where = (e: AuditEvent) => `${e.pos.km === null ? "" : `${fmtKm(e.pos.km)} · `}↑${Math.round(e.pos.ascent)} m`

function Entry({ e }: { e: AuditEvent }) {
  const r = e.reminder
  if (r) {
    const sodium = r.items.reduce((a, i) => a + (i.sodium ?? 0), 0)
    const caffeine = r.items.reduce((a, i) => a + (i.caffeine ?? 0), 0)
    return (
      <>
        <p className="font-bold">
          #{r.number} {r.items.map((i) => i.name).join(" + ") || "Skip"}
          <span className="ml-2 text-xs font-semibold text-muted-foreground">
            {REMINDER_STATE_TEXT[e.reminder!.state]}
            {r.carbs > 0 && r.state !== "skipped" && ` ${fmtSigned(r.carbs - r.target)}`}
          </span>
        </p>
        {r.rule !== "full" && r.station && <p className="text-xs text-muted-foreground">{r.station}</p>}
        <p className="text-xs text-muted-foreground">
          {Math.round(r.carbs)} g carbs
          {sodium > 0 && ` · ${Math.round(sodium)} mg Na`}
          {caffeine > 0 && ` · caffeine ${Math.round(caffeine)} mg`} · {where(e)}
        </p>
      </>
    )
  }
  if (e.station) {
    const sodium = e.station.items.reduce((a, i) => a + (i.sodium ?? 0), 0)
    return (
      <>
        <p className="font-bold">
          CREW {e.station.name.trim() || "Aid station"}
        </p>
        <p className="text-xs text-muted-foreground">
          {e.station.items.map((i) => i.name).join(" · ") || "Nothing planned"}
        </p>
        <p className="text-xs text-muted-foreground">
          {Math.round(carbsOf(e.station.items))} g carbs{sodium > 0 && ` · ${Math.round(sodium)} mg Na`} · {where(e)}
        </p>
      </>
    )
  }
  return <p className="font-bold">{e.kind === "start" ? "Start" : `Finish · planned ${fmtDur(e.min)}`}</p>
}

/** One audit-trail row: time, what happens, and the running carbs in against carbs burned. */
export function PrintAuditRow({ race, e }: { race: RaceDetail; e: AuditEvent }) {
  return (
    <li className="print-avoid grid grid-cols-[64px_1fr_96px] gap-3 border-b border-border py-2 text-sm">
      <div className="tabular-nums">
        <p className="font-extrabold">{timeLabel(race, e.min)}</p>
        {race.startTime && <p className="text-xs text-muted-foreground">{fmtDur(e.min)}</p>}
      </div>
      <div>
        <Entry e={e} />
      </div>
      <div className="text-right tabular-nums">
        <p className="font-extrabold">{Math.round(e.carbsIn)} g</p>
        <p className="text-xs text-muted-foreground">vs {Math.round(e.carbsOut)} g burned</p>
      </div>
    </li>
  )
}
