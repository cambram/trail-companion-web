import { Fragment } from "react"

import { PrintAuditRow } from "@/components/molecules/PrintAuditRow"
import { PrintSheet } from "@/components/molecules/PrintSheet"
import type { AuditEvent } from "@/lib/planInsights"
import { allocate, carbsOf, fmtDur, needed, planned, raceTotals, stationCarbs } from "@/lib/planMath"
import { timeLabel } from "@/lib/printPlan"
import type { RaceDetail } from "@/lib/racesApi"

const th = "px-2 py-1 text-right text-[0.6875rem] font-extrabold tracking-wide text-muted-foreground uppercase"
const td = "px-2 py-1.5 text-right tabular-nums"

export function PrintAudit({ race, events }: { race: RaceDetail; events: AuditEvent[] }) {
  const allocs = allocate(race)
  const totals = raceTotals(race)
  const rows = race.segments.map((s, i) => {
    const start = race.segments.slice(0, i).reduce((t, x) => t + (x.duration || 0), 0)
    return {
      key: s.id,
      name: s.name.trim() || `Segment ${i + 1}`,
      range: `${timeLabel(race, start)}–${timeLabel(race, start + (s.duration || 0))}`,
      duration: s.duration || 0,
      target: needed(race.target, s),
      crew: stationCarbs(s),
      reminders: allocs[i].reminders.reduce((t, r) => t + r.carbs, 0),
      flask: carbsOf(s.items),
      total: planned(s, allocs[i]),
    }
  })
  const sum = (f: (r: (typeof rows)[number]) => number) => Math.round(rows.reduce((t, r) => t + f(r), 0))
  return (
    <PrintSheet raceName={race.name} kicker="Nutrition audit trail" timeRange={`${timeLabel(race, 0)}–${timeLabel(race, totals.duration)}`} title="Audit trail">
      <table className="print-avoid w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className={`${th} text-left`}>Segment</th>
            <th className={th}>Time</th>
            <th className={th}>Dur.</th>
            <th className={th}>Target</th>
            <th className={th}>Crew</th>
            <th className={th}>Reminders</th>
            <th className={th}>Flask</th>
            <th className={th}>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-border">
              <td className="px-2 py-1.5 font-bold">{r.name}</td>
              <td className={td}>{r.range}</td>
              <td className={td}>{fmtDur(r.duration)}</td>
              <td className={td}>{r.target} g</td>
              <td className={td}>{r.crew > 0 ? `${Math.round(r.crew)} g` : "–"}</td>
              <td className={td}>{Math.round(r.reminders)} g</td>
              <td className={td}>{Math.round(r.flask)} g</td>
              <td className={`${td} font-extrabold`}>{Math.round(r.total)} g</td>
            </tr>
          ))}
          <tr className="font-extrabold">
            <td className="px-2 py-1.5">Race</td>
            <td className={td} />
            <td className={td}>{fmtDur(totals.duration)}</td>
            <td className={td}>{totals.need} g</td>
            <td className={td}>{sum((r) => r.crew)} g</td>
            <td className={td}>{sum((r) => r.reminders)} g</td>
            <td className={td}>{sum((r) => r.flask)} g</td>
            <td className={td}>{Math.round(totals.planned)} g</td>
          </tr>
        </tbody>
      </table>

      <ol className="mt-5 border-t border-border">
        {events.map((e, k) => (
          <Fragment key={k}>
            {(k === 0 || events[k - 1].segmentIndex !== e.segmentIndex) && e.kind !== "start" && (
              <li className="print-avoid pt-3 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
                Segment {e.segmentIndex + 1} · {race.segments[e.segmentIndex].name.trim() || "unnamed"}
              </li>
            )}
            <PrintAuditRow race={race} e={e} />
          </Fragment>
        ))}
      </ol>
    </PrintSheet>
  )
}
