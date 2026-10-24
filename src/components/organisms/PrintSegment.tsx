import { PrintAuditRow } from "@/components/molecules/PrintAuditRow"
import { PrintSheet } from "@/components/molecules/PrintSheet"
import { countItems, segmentStats, type AuditEvent } from "@/lib/planInsights"
import { allocate, carbsOf, fmtDur, fmtKm, fmtPace, legs, needed, planned, stationCarbs } from "@/lib/planMath"
import { segmentEvents, timeLabel } from "@/lib/printPlan"
import type { RaceDetail } from "@/lib/racesApi"

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary px-3 py-2">
      <p className="text-[0.6875rem] font-extrabold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="text-lg font-extrabold">{value}</p>
    </div>
  )
}

function List({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="print-avoid">
      <p className="mb-1 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">{title}</p>
      {lines.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing planned</p>
      ) : (
        <ul className="grid gap-1 text-sm">
          {lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

type Props = { race: RaceDetail; index: number; events: AuditEvent[] }

export function PrintSegment({ race, index, events }: Props) {
  const s = race.segments[index]
  const a = allocate(race)[index]
  const st = segmentStats(s, a, legs(race.segments)[index])
  const start = race.segments.slice(0, index).reduce((t, x) => t + (x.duration || 0), 0)
  const end = start + (s.duration || 0)
  const last = index === race.segments.length - 1
  const from = index === 0 ? (s.aidStation?.name.trim() || "Start") : s.aidStation?.name.trim() || null
  const to = last ? "Finish" : race.segments[index + 1].aidStation?.name.trim() || null
  const numbers = a.reminders.length === 0 ? null : `#${a.reminders[0].number}${a.reminders.length > 1 ? `–${a.reminders.at(-1)!.number}` : ""}`
  const reminderCarbs = a.reminders.reduce((t, r) => t + r.carbs, 0)
  const carry = countItems(a.reminders.flatMap((r) => r.items)).map((x) => `${x.count} × ${x.name}`)
  const flasks = s.items.map((f) => `${f.name}${f.carbs !== null ? ` · ${f.carbs} g` : ""}${f.sodium !== null ? ` · ${Math.round(f.sodium)} mg Na` : ""}`)
  return (
    <PrintSheet
      raceName={race.name}
      kicker={`Segment ${index + 1} of ${race.segments.length}`}
      timeRange={`${timeLabel(race, start)}–${timeLabel(race, end)}`}
      title={s.name.trim() || `Segment ${index + 1}`}
    >
      {from && to && <p className="-mt-2 mb-3 text-sm text-muted-foreground">{from} → {to}</p>}
      <div className="grid grid-cols-4 gap-2.5">
        <Chip label="Duration" value={fmtDur(s.duration || 0)} />
        <Chip label="Target" value={`${needed(race.target, s)} g`} />
        <Chip label="Planned" value={`${Math.round(planned(s, a))} g`} />
        <Chip label="Reminders" value={numbers ?? "none"} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {[
          st.distance === null ? null : fmtKm(st.distance),
          st.pace === null ? null : `${fmtPace(st.pace)} /km`,
          s.ascentM === null ? null : `↑${s.ascentM} m`,
        ].filter(Boolean).join(" · ")}
        {st.distance !== null || s.ascentM !== null ? " · " : ""}
        Crew {Math.round(stationCarbs(s))} g · Reminders {Math.round(reminderCarbs)} g · Flask {Math.round(carbsOf(s.items))} g
      </p>

      <div className="mt-4 grid grid-cols-2 gap-6">
        <List title="Carry" lines={carry} />
        <List title="Flasks" lines={flasks} />
      </div>
      {s.notes.trim() && (
        <div className="print-avoid mt-4">
          <p className="mb-1 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">Notes</p>
          <p className="text-sm whitespace-pre-wrap">{s.notes}</p>
        </div>
      )}

      <p className="mt-5 mb-1 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">Audit trail</p>
      <ol className="border-t border-border">
        {segmentEvents(events, index, race.segments.length).map((e, k) => (
          <PrintAuditRow key={k} race={race} e={e} />
        ))}
      </ol>
    </PrintSheet>
  )
}
