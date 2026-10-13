import { StatusPill } from "@/components/atoms/StatusPill"
import { Card } from "@/components/ui/card"
import {
  fmtBehind,
  fmtDur,
  fmtInstant,
  fmtPace,
  type Pacing,
  type Prediction,
  type SegmentResult,
  type Checkpoint,
} from "@/lib/planMath"

type Props = {
  onCourse: { next: Checkpoint; plannedMs: number } | null
  result: SegmentResult | null
  guess: Prediction | null
  pacing: Pacing | null
  timeZone: string
}

const pace = (minPerKm: number | null) => (minPerKm === null ? "–" : `${fmtPace(minPerKm)} /km`)

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p className="text-[1.05rem] font-extrabold tracking-[-0.02em]">{children}</p>
    </div>
  )
}

/** Cards 1 to 3. Before the first arrival there is no pace data, so only the planned arrival shows. */
export function InsightCards({ onCourse, result, guess, pacing, timeZone }: Props) {
  if (onCourse)
    return (
      <Card>
        <p className="text-xs font-extrabold text-muted-foreground">On course</p>
        <p className="text-[1.05rem] font-extrabold tracking-[-0.02em]">
          On course to {onCourse.next.name}, planned {fmtInstant(onCourse.plannedMs, timeZone)}
        </p>
        <p className="text-[0.8125rem] text-muted-foreground">
          The cards appear once the first aid station is recorded: there is no pace data before then.
        </p>
      </Card>
    )

  return (
    <>
      {result && (
        <Card>
          <p className="text-xs font-extrabold text-muted-foreground">
            Segment result · {result.from} → {result.to}
          </p>
          <div className="grid grid-cols-3 items-end gap-2.5">
            <Stat label="Time">{fmtDur(result.actualMin)}</Stat>
            <Stat label="Pace">{pace(result.pace)}</Stat>
            <div>
              <p className="text-xs font-bold text-muted-foreground">Plan</p>
              <StatusPill ok={result.behindMin <= 0}>{fmtBehind(result.behindMin)}</StatusPill>
            </div>
          </div>
        </Card>
      )}

      {guess && (
        <Card>
          <p className="text-xs font-extrabold text-muted-foreground">Predicted arrival · {guess.next.name}</p>
          <p className="text-[2.1rem] leading-[1.1] font-extrabold tracking-[-0.03em]">{fmtInstant(guess.predictedMs, timeZone)}</p>
          <p className="text-[0.8125rem] text-muted-foreground">
            Planned {fmtInstant(guess.plannedMs, timeZone)}. At {Math.round(guess.ratio * 100)}% of planned time so far.
          </p>
        </Card>
      )}

      {pacing && (
        <div className="grid grid-cols-2 gap-3.5">
          <Card>
            <p className="text-xs font-extrabold text-muted-foreground">A · Hold the planned arrival</p>
            <p className="text-[1.35rem] font-extrabold tracking-[-0.03em]">{fmtInstant(pacing.a.plannedMs, timeZone)}</p>
            {pacing.a.achievable ? (
              <>
                <p className="text-[0.8125rem] text-muted-foreground">{fmtDur(pacing.a.availableMin)} available</p>
                <p className="font-bold">{pacing.a.requiredPace === null ? "Times only" : `Need ${pace(pacing.a.requiredPace)}`}</p>
              </>
            ) : (
              <p className="font-bold">Not achievable</p>
            )}
          </Card>
          <Card>
            <p className="text-xs font-extrabold text-muted-foreground">B · Hold the planned time</p>
            <p className="text-[1.35rem] font-extrabold tracking-[-0.03em]">{fmtInstant(pacing.b.arrivalMs, timeZone)}</p>
            <p className="text-[0.8125rem] text-muted-foreground">{fmtDur(pacing.b.legMin)} as planned</p>
            <p className="font-bold">{pacing.b.plannedPace === null ? "Times only" : `At ${pace(pacing.b.plannedPace)}`}</p>
          </Card>
        </div>
      )}
    </>
  )
}
