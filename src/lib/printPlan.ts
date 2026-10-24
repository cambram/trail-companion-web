import { caffeineDoses, type AuditEvent, type ReminderState } from "./planInsights.ts"
import { clockToMin, fmtClock, fmtDur, raceTotals } from "./planMath.ts"
import type { RaceDetail } from "./racesApi.ts"

export type PrintSheet =
  | { kind: "cover" }
  | { kind: "prep" }
  | { kind: "segment"; index: number }
  | { kind: "station"; segmentIndex: number; stopNumber: number; stopCount: number }
  | { kind: "audit" }
  | { kind: "balance" }

/** Cover and prep, then each segment preceded by the aid station before it, then the audit trail and balance chart. */
export function sheetOrder(race: Pick<RaceDetail, "segments">): PrintSheet[] {
  if (race.segments.length === 0) return [{ kind: "cover" }]
  const stopCount = race.segments.filter((s) => s.aidStation).length
  let stopNumber = 0
  const middle = race.segments.flatMap((s, index): PrintSheet[] => [
    ...(s.aidStation ? [{ kind: "station" as const, segmentIndex: index, stopNumber: ++stopNumber, stopCount }] : []),
    { kind: "segment", index },
  ])
  return [{ kind: "cover" }, { kind: "prep" }, ...middle, { kind: "audit" }, { kind: "balance" }]
}

export type CoverStats = {
  distanceKm: number | null
  durationMin: number
  plannedCarbs: number
  needCarbs: number
  bufferCarbs: number
  plannedPerHour: number | null
  caffeineMg: number
  perReminderCarbs: number
  finishClock: string | null
}

export function coverStats(race: RaceDetail): CoverStats {
  const t = raceTotals(race)
  return {
    distanceKm: t.distance > 0 ? t.distance : null,
    durationMin: t.duration,
    plannedCarbs: t.planned,
    needCarbs: t.need,
    bufferCarbs: t.planned - t.need,
    plannedPerHour: t.duration > 0 ? t.planned / (t.duration / 60) : null,
    caffeineMg: Math.round(caffeineDoses(race).reduce((a, d) => a + d.mg, 0)),
    perReminderCarbs: Math.round((race.target * race.reminderIntervalMin) / 60),
    finishClock: race.startTime ? fmtClock(clockToMin(race.startTime) + t.duration) : null,
  }
}

/** Race minute -> clock "HH:mm" with a start time, elapsed "2h36" without. */
export const timeLabel = (race: Pick<RaceDetail, "startTime">, min: number) =>
  race.startTime ? fmtClock(clockToMin(race.startTime) + min) : fmtDur(min)

/** "+2 g", "−3 g", "±0 g" for a rounded gram difference. */
export const fmtSigned = (n: number) => `${Math.round(n) > 0 ? "+" : Math.round(n) < 0 ? "−" : "±"}${Math.abs(Math.round(n))} g`

/** Text for each reminder state, so a black-and-white print stays readable. */
export const REMINDER_STATE_TEXT: Record<ReminderState, string> = {
  ok: "on target",
  short: "short",
  empty: "empty",
  over: "over",
  small: "planned small",
  skipped: "skipped",
  "skip-food": "eaten on a skip",
}

/** A segment's own rows: the start (first segment), its reminders, the finish (last segment). Station rows belong to the station sheet. */
export function segmentEvents(events: AuditEvent[], index: number, segmentCount: number): AuditEvent[] {
  return events.filter(
    (e) =>
      (e.kind === "start" && index === 0) ||
      (e.kind === "reminder" && e.segmentIndex === index) ||
      (e.kind === "finish" && index === segmentCount - 1),
  )
}
