import { Card } from "@/components/ui/card"
import { clockToMin, fmtClock, fmtHM } from "@/lib/planMath"
import type { RaceDetail } from "@/lib/racesApi"

type Props = { race: RaceDetail; onJump: (segmentId: string) => void }

/** Segments sized by planned time. Tapping one scrolls to and opens its card. */
export function CourseStrip({ race, onJump }: Props) {
  const mins = race.segments.map((s) => s.duration || 0)
  const total = mins.reduce((t, m) => t + m, 0)
  if (total <= 0) return null
  const start = race.startTime ? clockToMin(race.startTime) : null
  const stops = race.segments.flatMap((s, i) =>
    i > 0 && s.aidStation ? [{ id: s.id, at: mins.slice(0, i).reduce((t, m) => t + m, 0) }] : [],
  )
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-extrabold text-muted-foreground">Course · tap a segment</p>
        {start !== null && <p className="text-xs font-bold tabular-nums text-muted-foreground">{fmtClock(start)} → {fmtClock(start + total)}</p>}
      </div>
      <div className="flex items-center">
        {race.segments.map((s, i) => (
          <div key={s.id} className="flex min-w-0 items-center" style={{ flexGrow: mins[i] || 0.01, flexBasis: 0 }}>
            {i > 0 && s.aidStation && <span aria-hidden className="z-10 -mx-[5px] size-3.5 flex-none rounded-full border-[3px] border-card bg-violet" />}
            <button
              className="flex h-8 min-w-0 flex-1 items-center overflow-hidden rounded-[10px] bg-primary px-2 text-[0.6875rem] font-bold whitespace-nowrap text-primary-foreground tabular-nums"
              aria-label={`Segment ${i + 1}, ${fmtHM(mins[i])}`}
              onClick={() => onJump(s.id)}
            >
              {i + 1} · {fmtHM(mins[i])}
            </button>
          </div>
        ))}
      </div>
      {start !== null && (
        <div className="flex justify-between text-[0.6875rem] text-muted-foreground tabular-nums">
          <span>Start</span>
          {stops.map((x) => <span key={x.id} className="text-violet">{fmtClock(start + x.at)}</span>)}
          <span>Finish</span>
        </div>
      )}
    </Card>
  )
}
