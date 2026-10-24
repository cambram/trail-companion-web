import { PrintAuditRow } from "@/components/molecules/PrintAuditRow"
import { PrintSheet } from "@/components/molecules/PrintSheet"
import { countItems, type AuditEvent } from "@/lib/planInsights"
import { carbsOf, checkpoints, crewStops, kitLabel } from "@/lib/planMath"
import { timeLabel } from "@/lib/printPlan"
import type { RaceDetail } from "@/lib/racesApi"

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

type Props = { race: RaceDetail; segmentIndex: number; stopNumber: number; stopCount: number; events: AuditEvent[] }

export function PrintStation({ race, segmentIndex, stopNumber, stopCount, events }: Props) {
  const station = race.segments[segmentIndex].aidStation
  if (!station) return null
  const arrival = checkpoints(race.segments).find((c) => c.stationId === station.id)
  const stop = crewStops(race).find((x) => x.station.id === station.id)
  const event = events.find((e) => e.station?.id === station.id)
  const hands = station.items.map((i) => `${i.name}${i.carbs !== null ? ` · ${i.carbs} g` : ""}`)
  const pack = countItems(stop?.packNext ?? []).map((x) => `${x.count} × ${x.name}`)
  return (
    <PrintSheet
      raceName={race.name}
      kicker={`Crew stop ${stopNumber} of ${stopCount}`}
      timeRange={arrival ? `arrive ${timeLabel(race, arrival.plannedMin)}` : undefined}
      title={station.name.trim() || "Aid station"}
    >
      <div className="grid grid-cols-2 gap-6">
        <List title={`Crew hands you · ${Math.round(carbsOf(station.items))} g`} lines={hands} />
        <List title="Pack next (swap in this bag)" lines={pack} />
      </div>
      <div className="mt-4">
        <List title="Kit" lines={station.kit.map(kitLabel)} />
      </div>
      {station.notes.trim() && (
        <div className="print-avoid mt-4">
          <p className="mb-1 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">Notes</p>
          <p className="text-sm whitespace-pre-wrap">{station.notes}</p>
        </div>
      )}
      {event && (
        <>
          <p className="mt-5 mb-1 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">Audit trail</p>
          <ol className="border-t border-border">
            <PrintAuditRow race={race} e={event} />
          </ol>
        </>
      )}
    </PrintSheet>
  )
}
