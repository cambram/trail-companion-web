import type { RaceDetail, Segment } from "./racesApi"

const pad = (n: number) => String(n).padStart(2, "0")

export const fmtHM = (min: number) => `${Math.floor(min / 60)}:${pad(Math.round(min % 60))}`

export const fmtDur = (min: number) => {
  const r = Math.round(min)
  return `${Math.floor(r / 60)}h${pad(r % 60)}`
}

export const fmtPace = (minPerKm: number) => {
  const s = Math.round(minPerKm * 60)
  return `${Math.floor(s / 60)}:${pad(s % 60)}`
}

/** "3:00" -> 180, "3" -> 180, "" -> 0, invalid -> null. Minutes. */
export function parseDur(v: string): number | null {
  v = v.trim()
  if (!v) return 0
  const m = v.match(/^(\d{1,2}):([0-5]\d)$/)
  if (m) return +m[1] * 60 + +m[2]
  if (/^\d{1,2}$/.test(v)) return +v * 60
  return null
}

export const paceText = (s: Pick<Segment, "duration" | "distance">) =>
  s.duration && s.distance && s.distance > 0 ? `${fmtPace(s.duration / s.distance)} /km` : "– /km"

export const planned = (s: Segment) => s.items.reduce((a, i) => a + (i.carbs || 0), 0)

export const needed = (target: number, s: Segment) => Math.round((s.duration / 60) * (target || 0))

export const pct = (p: number, n: number) => (n ? Math.min(100, Math.round((p / n) * 100)) : 0)

export function raceTotals(r: RaceDetail) {
  return r.segments.reduce(
    (t, s) => ({
      duration: t.duration + (s.duration || 0),
      distance: t.distance + (s.distance || 0),
      planned: t.planned + planned(s),
      need: t.need + needed(r.target, s),
    }),
    { duration: 0, distance: 0, planned: 0, need: 0 },
  )
}

/** Green when planned >= 95% of need. */
export const onTarget = (p: number, n: number) => n > 0 && p >= n * 0.95

/** "06:30:00" or "06:30" -> 390 minutes since midnight. */
export const clockToMin = (t: string) => {
  const [h, m] = t.split(":")
  return +h * 60 + +m
}

/** Minutes since race-day midnight -> "HH:mm", "+1d" past midnight. */
export function fmtClock(min: number) {
  const day = Math.floor(min / 1440)
  const m = Math.round(min % 1440)
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}${day ? ` +${day}d` : ""}`
}

/** Arrival at the end of each segment, minutes since midnight; null without a start time. */
export function etas(r: Pick<RaceDetail, "startTime" | "segments">) {
  if (!r.startTime) return r.segments.map(() => null)
  let t = clockToMin(r.startTime)
  return r.segments.map((s) => (t += s.duration || 0))
}
