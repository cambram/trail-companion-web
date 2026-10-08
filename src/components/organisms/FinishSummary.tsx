import { StatusPill } from "@/components/atoms/StatusPill"
import { ConfirmButton } from "@/components/molecules/ConfirmButton"
import { Card } from "@/components/ui/card"
import { fmtBehind, fmtDur, fmtInstant, type finishSummary } from "@/lib/planMath"

type Props = {
  summary: NonNullable<ReturnType<typeof finishSummary>>
  finishedMs: number
  timeZone: string
  onUndo: () => void
}

/** Total time and the difference from plan. The timeline below it holds the splits. */
export function FinishSummary({ summary, finishedMs, timeZone, onUndo }: Props) {
  return (
    <Card className="items-center text-center">
      <p className="text-xs font-extrabold text-muted-foreground">Finish time</p>
      <p className="text-[2.1rem] leading-[1.1] font-extrabold tracking-[-0.03em]">{fmtDur(summary.totalMin)}</p>
      <p className="text-[0.8125rem] text-muted-foreground">
        Crossed at {fmtInstant(finishedMs, timeZone)} · planned {fmtDur(summary.plannedMin)}
      </p>
      <StatusPill ok={summary.behindMin <= 0}>{fmtBehind(summary.behindMin)}</StatusPill>
      <ConfirmButton label="Undo finish (mis-tap)" armedLabel="Tap again to undo the finish" onConfirm={onUndo} />
    </Card>
  )
}
