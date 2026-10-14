import type { AidStation, KitEntry, NutritionItem, NutritionType, PlannedItem, RaceDetail, ReminderItem, Run, RunState, Segment } from "./racesApi"

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

/** "3:30", "3.30", "3,30", "3 30", "330" -> 210 (H:MM, not decimal hours); "3" -> 180; "" -> 0; invalid -> null. */
export function parseDur(v: string): number | null {
  v = v.trim()
  if (!v) return 0
  const m = v.match(/^(\d{1,2})[:., ]?([0-5]\d)$/)
  if (m) return +m[1] < 24 ? +m[1] * 60 + +m[2] : null
  if (/^\d{1,2}$/.test(v)) return +v * 60
  return null
}

/** Whole metres 0 to 10000. "" -> 0 (the card stores blank as null), anything else -> null. Metres. */
export function parseAscent(v: string): number | null {
  v = v.trim()
  if (!v) return 0
  return /^\d{1,5}$/.test(v) && Number(v) <= 10_000 ? Number(v) : null
}

/** "12.5" or "12,5" -> 12.5, "" -> 0, negative or non-numeric -> null. Km. */
export function parseDistance(v: string): number | null {
  v = v.trim().replace(",", ".")
  if (!v) return 0
  return /^(\d+\.?\d*|\.\d+)$/.test(v) ? Number(v) : null
}

export const paceText = (duration: number, km: number | null) =>
  duration && km && km > 0 ? `${fmtPace(duration / km)} /km` : "– /km"

const roundKm = (km: number) => Math.round(km * 100) / 100

export const fmtKm = (km: number) => `${roundKm(km)} km`

export type Leg = { start: number; end: number | null; length: number | null }

/** Each segment starts at the last entered end mark before it, 0 km at the start line. Length is null when the end is blank. */
export function legs(segments: Pick<Segment, "endKm">[]): Leg[] {
  let last = 0
  return segments.map(({ endKm }) => {
    const start = last
    if (endKm !== null) last = endKm
    return { start, end: endKm, length: endKm === null ? null : roundKm(endKm - start) }
  })
}

export const NUTRITION_TYPES: NutritionType[] = ["Gel", "Liquid", "Solid", "Pill"]

/** Category colour, not status: see docs/styling.md 2.4. Literal strings so Tailwind emits them. */
export const NUTRITION_TYPE_CLASSES: Record<NutritionType, string> = {
  Gel: "bg-nutrition-gel-soft text-nutrition-gel",
  Liquid: "bg-nutrition-liquid-soft text-nutrition-liquid",
  Solid: "bg-nutrition-solid-soft text-nutrition-solid",
  Pill: "bg-nutrition-pill-soft text-nutrition-pill",
}

export const sizeUnit = (type: NutritionType) => (type === "Liquid" ? "ml" : type === "Pill" ? "mg" : "g")

export const sizeText = (n: Pick<NutritionItem, "type" | "size">) =>
  n.size === null ? "" : `${n.size} ${sizeUnit(n.type)}`

const carbsOf = (items: PlannedItem[]) => items.reduce((a, i) => a + (i.carbs ?? 0), 0)

const fluidOf = (items: PlannedItem[]) => items.reduce((a, i) => a + (i.type === "Liquid" ? (i.size ?? 0) : 0), 0)

/** Carbs eaten at the aid station before this segment. */
export const stationCarbs = (s: Segment) => carbsOf(s.aidStation?.items ?? [])

export const MIN_REMINDER_INTERVAL_MIN = 5
export const MAX_REMINDER_INTERVAL_MIN = 180
export const MAX_REMINDER_NUMBER = 500

const GENTLE_OVER = 0.1
const STRONG_OVER = 0.5
const SKIP_BEFORE_MIN = 20
const SKIP_AFTER_MIN = 15
const SMALL_UNTIL_MIN = 30
const SMALL_MAX_G = 25

export type CarbWarning = { level: "gentle" | "strong"; over: number }

export type StationNudge = { kind: "skip-before" | "skip-after" | "small"; text: string }

export type AllocatedReminder = {
  number: number
  atMin: number
  items: ReminderItem[]
  carbs: number
  target: number
  warning: CarbWarning | null
  nudge: StationNudge | null
}

export type SegmentAlloc = { reminders: AllocatedReminder[] }

export type Allocatable = Pick<RaceDetail, "target" | "reminderIntervalMin" | "reminders" | "segments">

/** Carbs per hour the segment's flasks carry, spread over its planned time. */
export const liquidPerHour = (s: Pick<Segment, "duration" | "items">) =>
  s.duration > 0 ? carbsOf(s.items.filter((i) => i.type === "Liquid")) / (s.duration / 60) : 0

/** Grams one reminder should hold: what the hourly target leaves after the flask, per interval. Never negative. */
export const reminderTarget = (target: number, intervalMin: number, liquid: number) =>
  Math.max(0, Math.round(((target - liquid) * intervalMin) / 60))

/** Advisory only. Up to 10% over is fine, over 50% is strong, and any carbs against a target of 0 are strong. */
export function carbWarning(carbs: number, target: number): CarbWarning | null {
  const over = carbs - target
  if (over <= 0) return null
  if (target <= 0) return { level: "strong", over }
  const ratio = over / target
  if (ratio <= GENTLE_OVER) return null
  return { level: ratio > STRONG_OVER ? "strong" : "gentle", over }
}

const NUDGE_TEXT = {
  "skip-before": "Skip this one: eat at the aid station.",
  "skip-after": "Skip this one: you've just eaten.",
  small: "Take something small, about 20 to 25 g.",
} as const

/** Planned minutes of every aid station, zero dwell. Shown only when it changes what the reminder asks for. */
export function stationNudge(atMin: number, carbs: number, stationMins: number[]): StationNudge | null {
  const before = stationMins.some((s) => s - atMin >= 0 && s - atMin <= SKIP_BEFORE_MIN)
  const after = stationMins.some((s) => atMin - s >= 0 && atMin - s <= SKIP_AFTER_MIN)
  if (before || after) {
    if (carbs <= 0) return null
    const kind = before ? "skip-before" : "skip-after"
    return { kind, text: NUDGE_TEXT[kind] }
  }
  const small = stationMins.some((s) => atMin - s > SKIP_AFTER_MIN && atMin - s <= SMALL_UNTIL_MIN)
  return small && carbs > SMALL_MAX_G ? { kind: "small", text: NUDGE_TEXT.small } : null
}

/**
 * Reminder n is at n x interval. A segment spans [start, end) of cumulative planned minutes, so a reminder on a boundary
 * belongs to the next segment, and one at or after the total never appears. Items stay on their reminder number, so a
 * changed interval moves them and changing it back restores them.
 */
export function allocate(r: Allocatable): SegmentAlloc[] {
  const interval = r.reminderIntervalMin
  const stations = checkpoints(r.segments).flatMap((c) => (c.stationId ? [c.plannedMin] : []))
  const itemsByNumber = new Map(r.reminders.map((x) => [x.number, x.items]))
  let start = 0
  return r.segments.map((s) => {
    const end = start + (s.duration || 0)
    const liquid = liquidPerHour(s)
    const reminders: AllocatedReminder[] = []
    if (interval > 0) {
      for (let n = Math.max(1, Math.ceil(start / interval)); n * interval < end && n <= MAX_REMINDER_NUMBER; n++) {
        const items = itemsByNumber.get(n) ?? []
        const carbs = carbsOf(items)
        const target = reminderTarget(r.target, interval, liquid)
        const atMin = n * interval
        reminders.push({ number: n, atMin, items, carbs, target, warning: carbWarning(carbs, target), nudge: stationNudge(atMin, carbs, stations) })
      }
    }
    start = end
    return { reminders }
  })
}

/** Shown when the items do not suit the interval: at least 2 warned reminders and at least half of the filled ones. */
export function planMismatch(allocs: SegmentAlloc[], target: number): { avg: number; suggestedIntervalMin: number } | null {
  const filled = allocs.flatMap((a) => a.reminders).filter((x) => x.carbs > 0)
  const warned = filled.filter((x) => x.warning)
  if (target <= 0 || warned.length < 2 || warned.length * 2 < filled.length) return null
  const avg = Math.round(filled.reduce((t, x) => t + x.carbs, 0) / filled.length)
  const suggested = Math.round(((avg / target) * 60) / 5) * 5
  return { avg, suggestedIntervalMin: Math.min(MAX_REMINDER_INTERVAL_MIN, Math.max(MIN_REMINDER_INTERVAL_MIN, suggested)) }
}

const reminderCarbs = (a: SegmentAlloc) => a.reminders.reduce((t, x) => t + x.carbs, 0)

/** Reminders allocated to the segment, its carried liquid, and the aid station before it. */
export const planned = (s: Segment, a: SegmentAlloc) => carbsOf(s.items) + stationCarbs(s) + reminderCarbs(a)

export const fluid = (s: Segment, a: SegmentAlloc) =>
  fluidOf(s.items) + fluidOf(s.aidStation?.items ?? []) + a.reminders.reduce((t, x) => t + fluidOf(x.items), 0)

export const needed = (target: number, s: Segment) => Math.round((s.duration / 60) * (target || 0))

export const pct = (p: number, n: number) => (n ? Math.min(100, Math.round((p / n) * 100)) : 0)

export function raceTotals(r: Allocatable) {
  const allocs = allocate(r)
  return r.segments.reduce(
    (t, s, i) => ({
      duration: t.duration + (s.duration || 0),
      distance: Math.max(t.distance, s.endKm ?? 0),
      planned: t.planned + planned(s, allocs[i]),
      need: t.need + needed(r.target, s),
      fluid: t.fluid + fluid(s, allocs[i]),
    }),
    { duration: 0, distance: 0, planned: 0, need: 0, fluid: 0 },
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

export type CrewStop = { station: AidStation; eta: number | null; packNext: PlannedItem[] }

/** Aid stations in race order with planned arrival and what goes in the vest for the segment after: its reminders, then its flask. */
export function crewStops(r: Allocatable & Pick<RaceDetail, "startTime">): CrewStop[] {
  const arrivals = etas(r)
  const allocs = allocate(r)
  const start = r.startTime ? clockToMin(r.startTime) : null
  return r.segments.flatMap((s, i) =>
    s.aidStation
      ? [
          {
            station: s.aidStation,
            eta: i === 0 ? start : arrivals[i - 1],
            packNext: [...allocs[i].reminders.flatMap((x) => x.items), ...s.items],
          },
        ]
      : [],
  )
}

const MS_MIN = 60_000

type Wall = { y: number; m: number; d: number; h: number; mi: number }

function wall(ms: number, timeZone: string): Wall {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(ms)
      .map((p) => [p.type, p.value]),
  )
  return { y: +parts.year, m: +parts.month, d: +parts.day, h: +parts.hour, mi: +parts.minute }
}

/** Wall clock minus UTC at an instant, in ms. */
function offsetMs(ms: number, timeZone: string) {
  const w = wall(ms, timeZone)
  return Date.UTC(w.y, w.m - 1, w.d, w.h, w.mi) - Math.floor(ms / MS_MIN) * MS_MIN
}

/** "HH:mm" of an instant on the wall clock of `timeZone`. */
export function fmtInstant(ms: number, timeZone: string) {
  const w = wall(ms, timeZone)
  return `${pad(w.h)}:${pad(w.mi)}`
}

/** "YYYY-MM-DD" of an instant on the wall clock of `timeZone`. */
export function zonedDate(ms: number, timeZone: string) {
  const w = wall(ms, timeZone)
  return `${w.y}-${pad(w.m)}-${pad(w.d)}`
}

/** A wall-clock date ("YYYY-MM-DD") and time ("HH:mm") in `timeZone` -> instant in ms. */
export function zonedToMs(date: string, hhmm: string, timeZone: string) {
  const [y, m, d] = date.split("-").map(Number)
  const [h, mi] = hhmm.split(":").map(Number)
  const guess = Date.UTC(y, m - 1, d, h, mi)
  return guess - offsetMs(guess - offsetMs(guess, timeZone), timeZone)
}

const shiftDate = (date: string, days: number) => {
  const [y, m, d] = date.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/** The instant for a typed "HH:mm" that lies closest to `nearMs`, so a time typed after midnight lands on the right day. */
export function nearestInstant(nearMs: number, hhmm: string, timeZone: string) {
  const day = zonedDate(nearMs, timeZone)
  return [-1, 0, 1]
    .map((delta) => zonedToMs(shiftDate(day, delta), hhmm, timeZone))
    .reduce((best, c) => (Math.abs(c - nearMs) < Math.abs(best - nearMs) ? c : best))
}

export type Checkpoint = {
  key: string
  index: number
  name: string
  plannedMin: number
  km: number | null
  climbM: number
  stationId: string | null
}

/**
 * Aid stations in race order, then the finish. A station sits before its segment, so it arrives where the segment
 * before it ends (0 for a station before the first segment). `km` is the cumulative mark there, null when blank; `climbM` is the cumulative ascent there.
 */
export function checkpoints(segments: Segment[]): Checkpoint[] {
  let elapsed = 0
  let climbed = 0
  const out: Omit<Checkpoint, "index">[] = []
  segments.forEach((s, i) => {
    if (s.aidStation) {
      out.push({
        key: s.aidStation.id,
        name: s.aidStation.name || "Aid station",
        plannedMin: elapsed,
        km: i === 0 ? 0 : segments[i - 1].endKm,
        climbM: climbed,
        stationId: s.aidStation.id,
      })
    }
    elapsed += s.duration || 0
    climbed += s.ascentM ?? 0
  })
  out.push({
    key: "finish",
    name: "Finish",
    plannedMin: elapsed,
    km: segments.at(-1)?.endKm ?? null,
    climbM: climbed,
    stationId: null,
  })
  return out.map((c, index) => ({ ...c, index }))
}

export type RunTimes = Pick<Run, "startedAtUtc" | "arrivals">

const startMs = (run: Pick<Run, "startedAtUtc">) => Date.parse(run.startedAtUtc)

const arrivalTimes = (run: Pick<Run, "arrivals">) =>
  new Map(run.arrivals.map((a) => [a.checkpoint, Date.parse(a.arrivedAtUtc)]))

/** The furthest checkpoint with an arrival; arrivals for checkpoints no longer on the plan are ignored. */
export function lastRecorded(cps: Checkpoint[], run: RunTimes): { index: number; ms: number } | null {
  const at = arrivalTimes(run)
  for (let i = cps.length - 1; i >= 0; i--) {
    const ms = at.get(cps[i].key)
    if (ms !== undefined) return { index: i, ms }
  }
  return null
}

/** The checkpoint after the furthest recorded one; a missed station is not offered again. Null once the finish is in. */
export function nextCheckpoint(cps: Checkpoint[], run: RunTimes): Checkpoint | null {
  return cps[(lastRecorded(cps, run)?.index ?? -1) + 1] ?? null
}

export type TimelineRow = { checkpoint: Checkpoint; plannedMs: number; actualMs: number | null; behindMin: number | null }

/** Planned (actual start + cumulative planned time) against actual for every checkpoint. */
export function timeline(cps: Checkpoint[], run: RunTimes): TimelineRow[] {
  const start = startMs(run)
  const at = arrivalTimes(run)
  return cps.map((checkpoint) => {
    const plannedMs = start + checkpoint.plannedMin * MS_MIN
    const actualMs = at.get(checkpoint.key) ?? null
    return {
      checkpoint,
      plannedMs,
      actualMs,
      behindMin: actualMs === null ? null : Math.round((actualMs - plannedMs) / MS_MIN),
    }
  })
}

/** "On plan", "15 min behind", "15 min ahead"; "1h15 behind" from an hour up. */
export function fmtBehind(min: number) {
  if (min === 0) return "On plan"
  const size = Math.abs(min)
  return `${size >= 60 ? fmtDur(size) : `${size} min`} ${min > 0 ? "behind" : "ahead"}`
}

/** Before any arrival there is no pace data: only the first checkpoint and its planned time. */
export function onCourse(cps: Checkpoint[], run: RunTimes): { next: Checkpoint; plannedMs: number } | null {
  if (lastRecorded(cps, run)) return null
  return { next: cps[0], plannedMs: startMs(run) + cps[0].plannedMin * MS_MIN }
}

export type SegmentResult = {
  from: string
  to: string
  actualMin: number
  plannedMin: number
  behindMin: number
  pace: number | null
}

/** Card 1: the leg just completed (from the previous recorded checkpoint, or the start). */
export function segmentResult(cps: Checkpoint[], run: RunTimes): SegmentResult | null {
  const last = lastRecorded(cps, run)
  if (!last) return null
  const start = startMs(run)
  const at = arrivalTimes(run)
  let prev: { name: string; ms: number; plannedMin: number; km: number | null } = { name: "Start", ms: start, plannedMin: 0, km: 0 }
  for (let i = last.index - 1; i >= 0; i--) {
    const ms = at.get(cps[i].key)
    if (ms !== undefined) {
      prev = { name: cps[i].name, ms, plannedMin: cps[i].plannedMin, km: cps[i].km }
      break
    }
  }
  const to = cps[last.index]
  const actualMin = (last.ms - prev.ms) / MS_MIN
  const km = to.km !== null && prev.km !== null ? to.km - prev.km : null
  return {
    from: prev.name,
    to: to.name,
    actualMin,
    plannedMin: to.plannedMin - prev.plannedMin,
    behindMin: Math.round((last.ms - start) / MS_MIN - to.plannedMin),
    pace: km !== null && km > 0 ? actualMin / km : null,
  }
}

/** Planned minutes that one metre of ascent is worth: 10 m of climbing adds 1 min. Tune after real races. */
export const CLIMB_M_PER_MIN = 10

/** Planned time plus its climbing, in minutes, from the start to a checkpoint. Equals plannedMin when no ascent is planned. */
export const weightMin = (cp: Pick<Checkpoint, "plannedMin" | "climbM">) => cp.plannedMin + cp.climbM / CLIMB_M_PER_MIN

export type Prediction = {
  next: Checkpoint
  predictedMs: number
  plannedMs: number
  ratio: number
  range: { lowMs: number; highMs: number } | null
}

const MIN_LEG_RATES = 2
const MIN_VISIBLE_SPREAD_MIN = 1

/**
 * Minutes behind plan per weight-minute, for each leg between consecutive recorded checkpoints (the start counts).
 * Legs with no planned time or no weight are skipped.
 */
function legDeviations(cps: Checkpoint[], run: RunTimes, lastIndex: number): number[] {
  const at = arrivalTimes(run)
  let prev = { ms: startMs(run), planned: 0, weight: 0 }
  const rates: number[] = []
  for (let i = 0; i <= lastIndex; i++) {
    const ms = at.get(cps[i].key)
    if (ms === undefined) continue
    const planned = cps[i].plannedMin
    const weight = weightMin(cps[i])
    const legWeight = weight - prev.weight
    const rate = ((ms - prev.ms) / MS_MIN - (planned - prev.planned)) / legWeight
    if (planned - prev.planned > 0 && legWeight > 0 && Number.isFinite(rate)) rates.push(rate)
    prev = { ms, planned, weight }
  }
  return rates
}

const sampleSd = (xs: number[]) => {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length
  return Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length - 1))
}

/**
 * Card 2: last actual arrival + next planned leg + the minutes already behind plan, shared out by weight (planned time plus
 * climbing). Planned times already include the climbing, so weight only decides how the deficit spreads over later legs.
 * With no ascent this is next planned leg x (actual / planned elapsed). The range is the spread of the per-leg deviations;
 * it needs two legs and shows only if it is wide enough.
 */
export function prediction(cps: Checkpoint[], run: RunTimes): Prediction | null {
  const last = lastRecorded(cps, run)
  const next = last ? cps[last.index + 1] : undefined
  if (!last || !next) return null
  const here = cps[last.index]
  const start = startMs(run)
  const elapsedMin = (last.ms - start) / MS_MIN
  const behindMin = elapsedMin - here.plannedMin
  const deviation = here.plannedMin > 0 && weightMin(here) > 0 ? behindMin / weightMin(here) : 0
  const raw = here.plannedMin > 0 ? elapsedMin / here.plannedMin : 1
  const legPlanned = next.plannedMin - here.plannedMin
  const legWeight = weightMin(next) - weightMin(here)
  const legMin = Math.max(legPlanned + deviation * legWeight, 0)
  const deviations = legDeviations(cps, run, last.index)
  const spread = deviations.length >= MIN_LEG_RATES ? sampleSd(deviations) * legWeight : 0
  return {
    next,
    predictedMs: last.ms + legMin * MS_MIN,
    plannedMs: start + next.plannedMin * MS_MIN,
    ratio: Number.isFinite(raw) && raw > 0 ? raw : 1,
    range:
      spread >= MIN_VISIBLE_SPREAD_MIN
        ? { lowMs: last.ms + Math.max(legMin - spread, 0) * MS_MIN, highMs: last.ms + (legMin + spread) * MS_MIN }
        : null,
  }
}

export type Pacing = {
  next: Checkpoint
  behindMin: number
  a: { plannedMs: number; availableMin: number; achievable: boolean; requiredPace: number | null }
  b: { arrivalMs: number; legMin: number; plannedPace: number | null }
}

const legKm = (from: Checkpoint, to: Checkpoint) =>
  from.km !== null && to.km !== null && to.km > from.km ? to.km - from.km : null

/** Card 3: A holds the planned arrival time, B holds the planned leg duration. Pace is null without distances. */
export function pacingOptions(cps: Checkpoint[], run: RunTimes, nowMs: number): Pacing | null {
  const last = lastRecorded(cps, run)
  const next = last ? cps[last.index + 1] : undefined
  if (!last || !next) return null
  const here = cps[last.index]
  const start = startMs(run)
  const km = legKm(here, next)
  const legMin = next.plannedMin - here.plannedMin
  const plannedMs = start + next.plannedMin * MS_MIN
  const availableMin = (plannedMs - last.ms) / MS_MIN
  const achievable = plannedMs > nowMs && availableMin > 0
  return {
    next,
    behindMin: Math.round((last.ms - start) / MS_MIN - here.plannedMin),
    a: { plannedMs, availableMin, achievable, requiredPace: achievable && km !== null ? availableMin / km : null },
    b: { arrivalMs: last.ms + legMin * MS_MIN, legMin, plannedPace: km !== null && legMin > 0 ? legMin / km : null },
  }
}

/** Total time and the difference from plan once the finish is in. */
export function finishSummary(
  cps: Checkpoint[],
  run: Pick<Run, "startedAtUtc" | "finishedAtUtc">,
): { totalMin: number; plannedMin: number; behindMin: number } | null {
  if (!run.finishedAtUtc) return null
  const totalMin = (Date.parse(run.finishedAtUtc) - startMs(run)) / MS_MIN
  const plannedMin = cps[cps.length - 1].plannedMin
  return { totalMin, plannedMin, behindMin: Math.round(totalMin - plannedMin) }
}

/** Why Start is disabled, or null when it is allowed. The server enforces the same rule. */
export function startLock(
  race: Pick<RaceDetail, "raceDate" | "segments">,
  state: Pick<RunState, "today" | "canStart">,
): string | null {
  if (race.segments.length === 0) return "Add at least one segment to the plan before starting."
  if (!race.raceDate) return "Set the race date on the plan to turn on live tracking."
  if (state.canStart) return null
  if (state.today < race.raceDate) return `Live tracking opens on race day, ${race.raceDate}. Today is ${state.today}.`
  return `Race day (${race.raceDate}) has passed, so live tracking can't be started.`
}

export const kitLabel = (k: KitEntry) => (k.certainty === "Maybe" ? `${k.label} (maybe)` : k.label)

export type Prep = { station: string; kit: string[]; food: string[]; packNext: string[] }

/** Card 4: what to have ready at the next checkpoint. The same data as the crew plan; null at the finish. */
export function prepFor(next: Checkpoint | null, race: Allocatable): Prep | null {
  if (!next?.stationId) return null
  const stop = crewStops({ ...race, startTime: null }).find((s) => s.station.id === next.stationId)
  if (!stop) return null
  return {
    station: stop.station.name,
    kit: stop.station.kit.map(kitLabel),
    food: stop.station.items.map((i) => i.name),
    packNext: stop.packNext.map((i) => i.name),
  }
}
