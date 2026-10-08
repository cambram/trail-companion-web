import { Navigate, useParams } from "react-router"

import { AppFrame } from "@/components/atoms/AppFrame"
import { ErrorText } from "@/components/atoms/ErrorText"
import { BackHeader } from "@/components/molecules/BackHeader"
import { ConfirmButton } from "@/components/molecules/ConfirmButton"
import { RunTimeline } from "@/components/organisms/RunTimeline"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRace } from "@/hooks/useRace"
import { useRun } from "@/hooks/useRun"
import { ApiError } from "@/lib/api"
import { checkpoints, fmtBehind, fmtInstant, lastRecorded, nextCheckpoint, startLock, timeline } from "@/lib/planMath"

const iso = (ms: number) => new Date(ms).toISOString()

export default function LivePage() {
  const { id = "" } = useParams()
  const { race, loadError, reload } = useRace(id)
  const { state, error, busy, gone, start, record, editStart, editArrival, undoArrival, undoStart } = useRun(id, reload)

  if ((loadError instanceof ApiError && loadError.status === 404) || gone) return <Navigate to="/" replace />

  const run = state?.run ?? null
  const zone = state?.timeZone ?? ""
  const cps = race ? checkpoints(race.segments) : []
  const last = run ? lastRecorded(cps, run) : null
  const next = run ? nextCheckpoint(cps, run) : null
  const rows = run ? timeline(cps, run) : []
  const lock = race && state ? startLock(race, state) : null
  const startMs = run ? Date.parse(run.startedAtUtc) : 0
  const lastRow = last ? rows[last.index] : null

  const headline = !run
    ? race?.raceDate
      ? `Race day ${race.raceDate}`
      : "No race date"
    : lastRow && lastRow.actualMs !== null && lastRow.behindMin !== null
      ? `${lastRow.checkpoint.name} at ${fmtInstant(lastRow.actualMs, zone)} · ${fmtBehind(lastRow.behindMin)}`
      : `Started ${fmtInstant(startMs, zone)}`

  return (
    <AppFrame>
      <BackHeader to={`/races/${id}`} label="Back to race plan" title="Live" />
      {loadError && !(loadError instanceof ApiError && loadError.status === 404) && <ErrorText>{loadError.message}</ErrorText>}
      {!(race && state) && !loadError && <p className="text-[0.8125rem] text-muted-foreground">Loading...</p>}
      {race && state && (
        <div className="grid gap-3.5">
          <div className="rounded-[26px] bg-primary p-[18px] text-primary-foreground">
            <div className="flex items-center justify-between gap-3">
              <b className="min-w-0 flex-1 truncate text-[1.35rem] font-extrabold tracking-[-0.03em]">{race.name}</b>
              <span className="flex-none rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-bold">
                {!run ? "Not started" : run.finishedAtUtc ? "Finished" : "Live"}
              </span>
            </div>
            <p className="mt-1 text-[0.8125rem] text-primary-foreground/65">{headline}</p>
          </div>

          {error && <ErrorText>{error}</ErrorText>}

          {!run && (
            <Card>
              {lock && <p className="text-[0.95rem] font-semibold">{lock}</p>}
              <Button block disabled={busy || lock !== null} onClick={() => start()}>
                Start race
              </Button>
              <p className="text-center text-[0.8125rem] text-muted-foreground">
                Press at the gun. The start time can be corrected afterwards.
              </p>
            </Card>
          )}

          {run && next && (
            <Card>
              <Button block disabled={busy} className="min-h-[72px] text-lg" onClick={() => record(next.key)}>
                Arrived at {next.name}
              </Button>
              <p className="text-center text-[0.8125rem] text-muted-foreground">Tap only when they're actually here.</p>
              {last && (
                <div className="flex justify-center">
                  <ConfirmButton
                    label="Undo last arrival"
                    armedLabel={`Tap again to undo ${cps[last.index].name}`}
                    onConfirm={() => undoArrival(cps[last.index].key)}
                  />
                </div>
              )}
            </Card>
          )}

          {run && !next && (
            <Card className="items-center text-center">
              <b>Finished</b>
              <p className="text-[0.8125rem] text-muted-foreground">
                Crossed the line at {run.finishedAtUtc ? fmtInstant(Date.parse(run.finishedAtUtc), zone) : "–"}.
              </p>
              <ConfirmButton
                label="Undo finish (mis-tap)"
                armedLabel="Tap again to undo the finish"
                onConfirm={() => undoArrival("finish")}
              />
            </Card>
          )}

          {run && (
            <RunTimeline
              rows={rows}
              startMs={startMs}
              timeZone={zone}
              lastIndex={last?.index ?? -1}
              onEditStart={(ms) => editStart(iso(ms))}
              onEditArrival={(key, ms) => editArrival(key, iso(ms))}
              onBackfill={(key, ms) => record(key, iso(ms))}
            />
          )}

          {run && (
            <div className="mt-2 flex justify-center">
              <ConfirmButton
                label="Undo start"
                armedLabel="Tap again to delete this run and every arrival"
                onConfirm={() => undoStart()}
              />
            </div>
          )}
        </div>
      )}
    </AppFrame>
  )
}
