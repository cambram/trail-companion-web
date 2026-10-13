import { StatusPill } from "@/components/atoms/StatusPill"
import { TimeEdit } from "@/components/molecules/TimeEdit"
import { Card } from "@/components/ui/card"
import { fmtBehind, fmtInstant, type TimelineRow } from "@/lib/planMath"

type Props = {
  rows: TimelineRow[]
  startMs: number
  timeZone: string
  lastIndex: number
  onEditStart: (ms: number) => Promise<boolean>
  onEditArrival: (key: string, ms: number) => Promise<boolean>
  onBackfill: (key: string, ms: number) => Promise<boolean>
}

/** Planned against actual for the start and every checkpoint. Tap a time to correct it; a missed station can be added. */
export function RunTimeline({ rows, startMs, timeZone, lastIndex, onEditStart, onEditArrival, onBackfill }: Props) {
  return (
    <Card>
      <p className="text-xs font-extrabold text-muted-foreground">Progress</p>
      <ul>
        <li className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 border-t border-line py-[9px]">
          <span className="font-semibold">Start</span>
          <span className="text-[0.8125rem] text-muted-foreground">Plan</span>
          <span className="min-w-[64px] text-right">
            <TimeEdit valueMs={startMs} timeZone={timeZone} label="start time" onSave={onEditStart} />
          </span>
        </li>
        {rows.map((row) => {
          const { checkpoint, plannedMs, actualMs, behindMin } = row
          const missed = actualMs === null && checkpoint.index < lastIndex
          return (
            <li
              key={checkpoint.key}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-1 border-t border-line py-[9px]"
            >
              <span className="min-w-0 truncate font-semibold">{checkpoint.name}</span>
              <span className="text-[0.8125rem] text-muted-foreground">{fmtInstant(plannedMs, timeZone)}</span>
              <span className="min-w-[64px] text-right">
                {actualMs !== null ? (
                  <TimeEdit
                    valueMs={actualMs}
                    timeZone={timeZone}
                    label={`${checkpoint.name} arrival time`}
                    onSave={(ms) => onEditArrival(checkpoint.key, ms)}
                  />
                ) : missed ? (
                  <TimeEdit
                    valueMs={plannedMs}
                    timeZone={timeZone}
                    label={`${checkpoint.name} arrival time`}
                    emptyLabel="Add time"
                    onSave={(ms) => onBackfill(checkpoint.key, ms)}
                  />
                ) : (
                  <span className="text-muted-foreground">–</span>
                )}
              </span>
              {behindMin !== null && (
                <span className="col-span-3">
                  <StatusPill ok={behindMin <= 0}>{fmtBehind(behindMin)}</StatusPill>
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
