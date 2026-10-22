import {
  allocate, carbsOf, checkpoints, clockToMin, fluid, fmtClock, fmtDur, fmtKm, kitLabel, legs, planned,
  type AllocatedReminder, type Allocatable, type Leg, type SegmentAlloc,
} from "./planMath.ts"
import type { AidStation, PlannedItem, RaceDetail, Segment } from "./racesApi.ts"

export const ARRIVAL_WINDOW = 0.1
export const CAFFEINE_HALF_LIFE_MIN = 300
export const LOW_FLUID_ML_PER_H = 600
export const SHORT_TOL_G = 5

const CAFFEINE_STEP_MIN = 5
const EFFORT_STEADY_PCT = 5
const M_PER_FLAT_KM = 100

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const perHour = (amount: number, minutes: number) => (minutes > 0 ? (amount / minutes) * 60 : null)
const field = (items: PlannedItem[], f: "sodium" | "caffeine") => sum(items.map((i) => i[f] ?? 0))

/** Every item that counts towards a segment: its flasks, the aid station before it, and its reminders. */
const intake = (s: Segment, a: SegmentAlloc): PlannedItem[] => [...s.items, ...(s.aidStation?.items ?? []), ...a.reminders.flatMap((r) => r.items)]

export type Position = { km: number | null; ascent: number }

/** Where the runner is at `min`, assuming even pace and even climbing inside a segment. Clamps to the finish. */
export function positionAt(segments: Segment[], min: number): Position {
  const spans = legs(segments)
  let t = 0
  let ascent = 0
  let at: Position = { km: 0, ascent: 0 }
  for (let i = 0; i < segments.length; i++) {
    const dur = segments[i].duration || 0
    const asc = segments[i].ascentM ?? 0
    const f = dur > 0 ? Math.min(1, Math.max(0, (min - t) / dur)) : min >= t ? 1 : 0
    const { start, end } = spans[i]
    at = { km: end === null ? null : start + f * (end - start), ascent: ascent + f * asc }
    if (min < t + dur) return at
    t += dur
    ascent += asc
  }
  return at
}

export type ReminderState = "skipped" | "skip-food" | "empty" | "short" | "ok" | "over" | "small"

/** The reminder's state comes from the aid station rule first, so a skipped reminder is never "empty". */
export function reminderState(r: Pick<AllocatedReminder, "carbs" | "target" | "rule" | "warning">): ReminderState {
  if (r.rule === "skip-before" || r.rule === "skip-after") return r.carbs > 0 ? "skip-food" : "skipped"
  if (r.carbs <= 0) return "empty"
  if (r.rule === "small" && r.warning === null && r.carbs <= r.target) return "small"
  if (r.warning) return "over"
  return r.carbs < r.target - SHORT_TOL_G ? "short" : "ok"
}

export type SegmentStats = {
  distance: number | null
  pace: number | null
  mPerKm: number | null
  effortPace: number | null
  vertPerHour: number | null
  carbsPerHour: number | null
  sodiumPerHour: number | null
  fluidPerHour: number | null
  sodium: number
  caffeine: number
  lowFluid: boolean
}

/** Per-segment numbers. Anything that needs a distance, a duration or an ascent that is not there is null. */
export function segmentStats(s: Segment, a: SegmentAlloc, leg: Leg): SegmentStats {
  const dur = s.duration || 0
  const items = intake(s, a)
  const dist = leg.length !== null && leg.length > 0 ? leg.length : null
  const asc = s.ascentM
  const fluidPerHour = perHour(fluid(s, a), dur)
  return {
    distance: dist,
    pace: dist !== null && dur > 0 ? dur / dist : null,
    mPerKm: dist !== null && asc !== null ? asc / dist : null,
    effortPace: dist !== null && dur > 0 ? dur / (dist + (asc ?? 0) / M_PER_FLAT_KM) : null,
    vertPerHour: asc !== null ? perHour(asc, dur) : null,
    carbsPerHour: perHour(planned(s, a), dur),
    sodiumPerHour: perHour(field(items, "sodium"), dur),
    fluidPerHour,
    sodium: field(items, "sodium"),
    caffeine: field(items, "caffeine"),
    lowFluid: fluidPerHour !== null && fluidPerHour < LOW_FLUID_ML_PER_H,
  }
}

export type EffortCue = { kind: "fast" | "slow" | "steady"; pct: number }

/** Compares a segment's effort pace (100 m up counts as 1 flat km) with the race average. */
export function effortCue(effortPace: number | null, avg: number | null): EffortCue | null {
  if (effortPace === null || avg === null || avg <= 0) return null
  const pct = Math.round(Math.abs(effortPace / avg - 1) * 100)
  if (pct < EFFORT_STEADY_PCT) return { kind: "steady", pct }
  return { kind: effortPace < avg ? "fast" : "slow", pct }
}

function segmentStatList(race: Allocatable) {
  const allocs = allocate(race)
  const spans = legs(race.segments)
  return race.segments.map((s, i) => segmentStats(s, allocs[i], spans[i]))
}

/** Total time over total flat-equivalent distance, using only segments that have both. */
export function avgEffortPace(race: Allocatable): number | null {
  const stats = segmentStatList(race)
  const rows = race.segments.map((s, i) => ({ s, st: stats[i] })).filter((x) => x.st.effortPace !== null)
  const flat = sum(rows.map((x) => x.s.duration / (x.st.effortPace as number)))
  return flat > 0 ? sum(rows.map((x) => x.s.duration)) / flat : null
}

export type AuditEvent = {
  kind: "start" | "station" | "reminder" | "finish"
  min: number
  pos: Position
  segmentIndex: number
  carbsIn: number
  carbsOut: number
  balance: number
  reminder?: AllocatedReminder & { state: ReminderState }
  station?: AidStation
}

type Intake = { min: number; carbs: number }

function intakes(race: Allocatable) {
  const allocs = allocate(race)
  const cps = checkpoints(race.segments)
  const events: Intake[] = [
    ...allocs.flatMap((a) => a.reminders.map((r) => ({ min: r.atMin, carbs: r.carbs }))),
    ...cps.filter((c) => c.stationId).map((c) => ({ min: c.plannedMin, carbs: carbsOf(race.segments.flatMap((s) => (s.aidStation?.id === c.stationId ? s.aidStation.items : []))) })),
  ]
  let t = 0
  const trickle = race.segments.map((s) => {
    const row = { t0: t, dur: s.duration || 0, carbs: carbsOf(s.items.filter((i) => i.type === "Liquid")) }
    t += row.dur
    return row
  })
  return { events, trickle, allocs, cps, total: t }
}

/** Cumulative carbs in by `min`. `before` leaves out intakes that land exactly on `min`. */
function carbsIn(d: ReturnType<typeof intakes>, min: number, before = false) {
  const eaten = sum(d.events.filter((e) => (before ? e.min < min : e.min <= min)).map((e) => e.carbs))
  const flask = sum(d.trickle.map((s) => (s.dur > 0 ? s.carbs * Math.min(1, Math.max(0, (min - s.t0) / s.dur)) : 0)))
  return eaten + flask
}

const RANK = { start: 0, station: 1, reminder: 2, finish: 3 } as const

/** Every moment on the plan in time order, with the running carb balance against the hourly target. */
export function auditTrail(race: Allocatable & Pick<RaceDetail, "startTime">): AuditEvent[] {
  const d = intakes(race)
  const out = (min: number) => (race.target * min) / 60
  const at = (kind: AuditEvent["kind"], min: number, segmentIndex: number, extra: Partial<AuditEvent> = {}): AuditEvent => {
    const cin = carbsIn(d, min)
    return { kind, min, pos: positionAt(race.segments, min), segmentIndex, carbsIn: cin, carbsOut: out(min), balance: cin - out(min), ...extra }
  }
  const stationSegment = (id: string | null) => Math.max(0, race.segments.findIndex((s) => s.aidStation?.id === id))
  const evs: AuditEvent[] = [
    at("start", 0, 0),
    ...d.cps.filter((c) => c.stationId).map((c) => at("station", c.plannedMin, stationSegment(c.stationId), { station: race.segments[stationSegment(c.stationId)].aidStation! })),
    ...d.allocs.flatMap((a, i) => a.reminders.map((r) => at("reminder", r.atMin, i, { reminder: { ...r, state: reminderState(r) } }))),
    at("finish", d.total, Math.max(0, race.segments.length - 1)),
  ]
  return evs.sort((x, y) => x.min - y.min || RANK[x.kind] - RANK[y.kind])
}

export type Gap = { lenMin: number; fromMin: number; toMin: number }

function longestGap(d: ReturnType<typeof intakes>): Gap | null {
  if (d.total <= 0) return null
  const times = [0, ...d.events.filter((e) => e.carbs > 0).map((e) => e.min).sort((a, b) => a - b), d.total]
  let best: Gap = { lenMin: 0, fromMin: 0, toMin: 0 }
  for (let i = 1; i < times.length; i++) if (times[i] - times[i - 1] > best.lenMin) best = { lenMin: times[i] - times[i - 1], fromMin: times[i - 1], toMin: times[i] }
  return best
}

export type Dose = { min: number; mg: number }

/** Caffeine in reminders and at stations lands when eaten. Carried flasks land at the middle of their segment. */
export function caffeineDoses(race: Allocatable): Dose[] {
  const d = intakes(race)
  const doses: Dose[] = [
    ...d.allocs.flatMap((a) => a.reminders.map((r) => ({ min: r.atMin, mg: field(r.items, "caffeine") }))),
    ...d.cps.filter((c) => c.stationId).map((c) => ({ min: c.plannedMin, mg: field(race.segments.flatMap((s) => (s.aidStation?.id === c.stationId ? s.aidStation.items : [])), "caffeine") })),
    ...race.segments.map((s, i) => ({ min: d.trickle[i].t0 + d.trickle[i].dur / 2, mg: field(s.items, "caffeine") })),
  ]
  return doses.filter((x) => x.mg > 0)
}

/** Active caffeine at `min`, halving every CAFFEINE_HALF_LIFE_MIN. */
export const caffeineAt = (doses: Dose[], min: number) =>
  sum(doses.filter((x) => x.min <= min).map((x) => x.mg * 0.5 ** ((min - x.min) / CAFFEINE_HALF_LIFE_MIN)))

export type RaceInsights = {
  netAtFinish: number
  low: { min: number; value: number } | null
  gap: Gap | null
  effortFadePct: number | null
  caffeinePeak: { min: number; mg: number } | null
  attention: { short: number; skipFood: number; empty: number }
  lowFluidSegments: number
  climbPerHour: number | null
  climbPerKm: number | null
}

export function insights(race: Allocatable): RaceInsights {
  const d = intakes(race)
  const stats = segmentStatList(race)
  const states = d.allocs.flatMap((a) => a.reminders.map(reminderState))
  const out = (min: number) => (race.target * min) / 60
  const net = (min: number, before = false) => carbsIn(d, min, before) - out(min)
  const samples = [
    { min: 0, value: net(0) },
    { min: d.total, value: net(d.total) },
    ...d.events.flatMap((e) => [{ min: e.min, value: net(e.min, true) }, { min: e.min, value: net(e.min) }]),
  ]
  const low = d.total > 0 ? samples.reduce((b, s) => (s.value < b.value ? s : b)) : null
  const efforts = stats.flatMap((s) => (s.effortPace === null ? [] : [s.effortPace]))
  const doses = caffeineDoses(race)
  let peak: { min: number; mg: number } | null = null
  for (let m = 0; m <= d.total && doses.length; m += CAFFEINE_STEP_MIN) {
    const mg = caffeineAt(doses, m)
    if (!peak || mg > peak.mg) peak = { min: m, mg }
  }
  const dist = Math.max(0, ...legs(race.segments).map((l) => l.end ?? 0))
  const asc = sum(race.segments.map((s) => s.ascentM ?? 0))
  return {
    netAtFinish: carbsIn(d, d.total) - out(d.total),
    low,
    gap: longestGap(d),
    effortFadePct: efforts.length >= 2 ? Math.round((Math.max(...efforts) / Math.min(...efforts) - 1) * 100) : null,
    caffeinePeak: peak,
    attention: {
      short: states.filter((s) => s === "short").length,
      skipFood: states.filter((s) => s === "skip-food").length,
      empty: states.filter((s) => s === "empty").length,
    },
    lowFluidSegments: stats.filter((s) => s.lowFluid).length,
    climbPerHour: asc > 0 ? perHour(asc, d.total) : null,
    climbPerKm: asc > 0 && dist > 0 ? asc / dist : null,
  }
}

export type CountedItem = { id: string; name: string; count: number; carbs: number }

/** Groups by library item, in first-seen order. Null carbs count as 0. */
export function countItems(items: PlannedItem[]): CountedItem[] {
  const map = new Map<string, CountedItem>()
  for (const i of items) {
    const row = map.get(i.nutritionItemId) ?? { id: i.nutritionItemId, name: i.name, count: 0, carbs: 0 }
    row.count += 1
    row.carbs += i.carbs ?? 0
    map.set(i.nutritionItemId, row)
  }
  return [...map.values()]
}

export const fmtCounts = (items: PlannedItem[]) => countItems(items).map((x) => `${x.count} × ${x.name}`).join(" · ")

/** Everything the plan eats or carries, most-needed first. */
export function shoppingList(race: Allocatable): CountedItem[] {
  const allocs = allocate(race)
  return countItems(race.segments.flatMap((s, i) => intake(s, allocs[i]))).sort((a, b) => b.count - a.count)
}

export type Bag = { segmentIndex: number; label: string; swapAt: string | null; items: PlannedItem[] }

/** What goes in the vest for each segment: its reminders, then its flasks. */
export function bags(race: Allocatable): Bag[] {
  const allocs = allocate(race)
  return race.segments.map((s, i) => ({
    segmentIndex: i,
    label: s.name.trim() || `Segment ${i + 1}`,
    swapAt: s.aidStation ? s.aidStation.name.trim() || "Aid station" : null,
    items: [...allocs[i].reminders.flatMap((r) => r.items), ...s.items],
  }))
}

export type ArrivalWindow = { early: number; planned: number; late: number }

/** Minutes into the race for an athlete running ARRIVAL_WINDOW faster or slower than plan. */
export const arrivalWindow = (plannedMin: number): ArrivalWindow => ({
  early: plannedMin * (1 - ARRIVAL_WINDOW),
  planned: plannedMin,
  late: plannedMin * (1 + ARRIVAL_WINDOW),
})

/** Cumulative ascent against distance. Null unless every segment has an end km and the race climbs. */
export function ascentProfile(segments: Segment[]) {
  if (!segments.length || segments.some((s) => s.endKm === null)) return null
  const points: [number, number][] = [[0, 0]]
  let asc = 0
  for (const s of segments) {
    asc += s.ascentM ?? 0
    points.push([s.endKm as number, asc])
  }
  const totalKm = points.at(-1)![0]
  if (asc <= 0 || totalKm <= 0 || points.some((p, i) => i > 0 && p[0] < points[i - 1][0])) return null
  const stops = segments.flatMap((s, i) => (s.aidStation && i > 0 ? [points[i]] : []))
  return { points, stops, totalKm, totalAscent: asc }
}

/** Plain text a runner can paste into a message to crew. Clock times only when a start time is set. */
export function crewBrief(race: Allocatable & Pick<RaceDetail, "name" | "startTime">): string {
  const start = race.startTime ? clockToMin(race.startTime) : null
  const allocs = allocate(race)
  const spans = legs(race.segments)
  const when = (min: number) => (start === null ? `${fmtDur(min)} into the race` : fmtClock(start + min))
  const finish = race.segments.reduce((t, s) => t + (s.duration || 0), 0)
  const head = `${race.name || "Race"} — crew brief${start === null ? "" : ` · start ${fmtClock(start)} · finish ~${fmtClock(start + finish)}`}`
  const stops = race.segments.flatMap((s, i) => {
    if (!s.aidStation) return []
    const min = race.segments.slice(0, i).reduce((t, x) => t + (x.duration || 0), 0)
    const w = arrivalWindow(min)
    const km = i === 0 ? 0 : spans[i - 1].end
    const lines = [
      `${s.aidStation.name || "Aid station"}${km === null ? "" : ` (${fmtKm(km)})`} — arrive ${when(min)} (window ${when(w.early)} to ${when(w.late)})`,
      s.aidStation.items.length ? `  Hand over: ${s.aidStation.items.map((x) => x.name).join(", ")} (${carbsOf(s.aidStation.items)} g)` : "",
      `  Pack next: ${fmtCounts([...allocs[i].reminders.flatMap((r) => r.items), ...s.items]) || "nothing planned"}`,
      s.aidStation.kit.length ? `  Kit: ${s.aidStation.kit.map(kitLabel).join(", ")}` : "",
      s.aidStation.notes ? `  Notes: ${s.aidStation.notes}` : "",
    ]
    return [lines.filter(Boolean).join("\n")]
  })
  return [head, ...stops].join("\n\n")
}
