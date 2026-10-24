import { PrintSheet } from "@/components/molecules/PrintSheet"
import { checkpoints, fmtDur, fmtHM, fmtKm, SKIP_AFTER_MIN, SKIP_BEFORE_MIN, SMALL_MAX_G, SMALL_UNTIL_MIN } from "@/lib/planMath"
import { coverStats, timeLabel } from "@/lib/printPlan"
import type { RaceDetail } from "@/lib/racesApi"

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-secondary px-3 py-2">
      <p className="text-[0.6875rem] font-extrabold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="text-xl font-extrabold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

const dateText = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

export function PrintCover({ race }: { race: RaceDetail }) {
  const c = coverStats(race)
  const hasStations = race.segments.some((s) => s.aidStation)
  const when = [race.raceDate && dateText(race.raceDate), race.startTime && `start ${timeLabel(race, 0)}`].filter(Boolean).join(" · ")
  const mins = race.segments.map((s) => s.duration || 0)
  return (
    <PrintSheet raceName={race.name} kicker="Race nutrition plan" timeRange={when || undefined} title={race.name || "Race plan"}>
      <div className="grid grid-cols-3 gap-2.5">
        <Tile label="Distance" value={c.distanceKm === null ? "–" : fmtKm(c.distanceKm)} />
        <Tile label="Planned time" value={fmtDur(c.durationMin)} sub={c.finishClock ? `finish ~${c.finishClock}` : undefined} />
        <Tile label="Needed" value={`${c.needCarbs} g`} sub={`target ${race.target} g/h`} />
        <Tile label="Planned" value={`${Math.round(c.plannedCarbs)} g`} sub={c.plannedPerHour === null ? undefined : `~${Math.round(c.plannedPerHour)} g/h`} />
        <Tile label="Buffer" value={`${c.bufferCarbs > 0 ? "+" : ""}${Math.round(c.bufferCarbs)} g`} sub="over target" />
        <Tile label="Caffeine" value={`~${c.caffeineMg} mg`} />
      </div>

      {race.segments.length > 0 && (
        <div className="print-avoid mt-5">
          <p className="mb-1.5 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">Course timeline · to scale</p>
          <div className="flex items-center">
            {race.segments.map((s, i) => (
              <div key={s.id} className="flex min-w-0 items-center" style={{ flexGrow: mins[i] || 0.01, flexBasis: 0 }}>
                {i > 0 && s.aidStation && <span aria-hidden className="z-10 -mx-[5px] size-3.5 flex-none rounded-full border-[3px] border-card bg-violet" />}
                <div className="flex h-9 min-w-0 flex-1 items-center overflow-hidden rounded-[10px] bg-primary px-2 text-xs font-bold whitespace-nowrap text-primary-foreground">
                  {s.name.trim() || `Segment ${i + 1}`} · {fmtHM(mins[i])}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
            Start {timeLabel(race, 0)}
            {checkpoints(race.segments).map((cp) => ` · ${cp.name} ${timeLabel(race, cp.plannedMin)}`)}
          </p>
        </div>
      )}

      <div className="print-avoid mt-5 grid grid-cols-2 gap-6">
        <div>
          <p className="mb-1 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">Strategy</p>
          <Row label="Carbs per hour" value={`${race.target} g/h`} />
          <Row label="Watch reminder" value={`every ${race.reminderIntervalMin} min`} />
          <Row label="Per reminder" value={`${c.perReminderCarbs} g`} />
          <Row label="Buffer over target" value={`${Math.round(c.bufferCarbs)} g`} />
        </div>
        {hasStations && (
          <div>
            <p className="mb-1 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">Reminder rules around crew</p>
            <ul className="grid gap-1.5 text-sm">
              <li>{SKIP_BEFORE_MIN} min before crew: skip, eat at the stop.</li>
              <li>Up to {SKIP_AFTER_MIN} min after leaving: skip, you have just eaten.</li>
              <li>
                {SKIP_AFTER_MIN} to {SMALL_UNTIL_MIN} min after leaving: something small, up to {SMALL_MAX_G} g.
              </li>
              <li>Off pace on the day? Follow the rules, not the clock.</li>
            </ul>
          </div>
        )}
      </div>
    </PrintSheet>
  )
}
