import assert from "node:assert/strict"

import { auditTrail } from "./planInsights.ts"
import { coverStats, fmtSigned, segmentEvents, sheetOrder, timeLabel } from "./printPlan.ts"
import type { AidStation, NutritionType, PlannedItem, RaceDetail, Segment } from "./racesApi.ts"

let uid = 0
const it = (name: string, carbs: number | null, extra: Partial<PlannedItem> = {}, type: NutritionType = "Gel"): PlannedItem => ({
  id: `i${uid++}`, nutritionItemId: name, position: 0, name, type, size: null, carbs, calories: null,
  caffeine: null, sodium: null, potassium: null, magnesium: null, calcium: null, ...extra,
})
const station = (name: string, items: PlannedItem[] = []): AidStation => ({
  id: `a-${name}`, name, notes: "", kit: [{ label: "Socks", certainty: "Planned" }], items: items.map((i) => ({ ...i, aidStationId: "x" })),
})
const seg = (duration: number, endKm: number | null, ascentM: number | null, items: PlannedItem[] = [], aid: AidStation | null = null): Segment => ({
  id: `s${uid++}`, position: 0, name: "", duration, endKm, ascentM, notes: "", items: items.map((i) => ({ ...i, segmentId: "x" })), aidStation: aid,
})
const race = (segments: Segment[], over: Partial<RaceDetail> = {}) =>
  ({ name: "T", target: 60, reminderIntervalMin: 30, reminders: [], segments, startTime: "06:00:00", ...over }) as RaceDetail
const noNaN = (v: unknown) => assert.ok(!JSON.stringify(v, (_, x) => (typeof x === "number" && !Number.isFinite(x) ? "BAD" : x)).includes('"BAD"'), "non-finite number leaked")

// sheetOrder: no segments is the cover only
assert.deepEqual(sheetOrder(race([])), [{ kind: "cover" }])

// sheetOrder: no stations
const plain = race([seg(60, 10, null), seg(60, 20, null)])
assert.deepEqual(sheetOrder(plain).map((s) => s.kind), ["cover", "prep", "segment", "segment", "audit", "balance"])

// sheetOrder: a station sheet comes before the segment it precedes, counted from 1
const withStops = race([seg(60, 10, null, [], station("A")), seg(60, 20, null), seg(60, 30, null, [], station("B"))])
const order = sheetOrder(withStops)
assert.deepEqual(order.map((s) => s.kind), ["cover", "prep", "station", "segment", "segment", "station", "segment", "audit", "balance"])
const stops = order.filter((s) => s.kind === "station")
assert.deepEqual(stops.map((s) => s.kind === "station" && [s.segmentIndex, s.stopNumber, s.stopCount]), [[0, 1, 2], [2, 2, 2]])

// coverStats
const cs = coverStats(race([seg(60, 10, null, [it("Flask", 30, {}, "Liquid")]), seg(60, 20, null)]))
assert.equal(cs.distanceKm, 20)
assert.equal(cs.durationMin, 120)
assert.equal(cs.perReminderCarbs, 30)
assert.equal(cs.finishClock, "08:00")
assert.equal(coverStats(race([seg(60, 10, null)], { startTime: null })).finishClock, null)
const empty = coverStats(race([]))
assert.equal(empty.distanceKm, null)
assert.equal(empty.plannedPerHour, null)
assert.equal(empty.finishClock, "06:00")
noNaN(empty)

// segmentEvents: start on the first segment, finish on the last, never stations
const events = auditTrail(plain)
assert.equal(segmentEvents(events, 0, 2)[0].kind, "start")
assert.equal(segmentEvents(events, 1, 2).at(-1)!.kind, "finish")
assert.ok(segmentEvents(auditTrail(withStops), 0, 3).every((e) => !e.station))

// timeLabel: clock with a start time, elapsed without
assert.equal(timeLabel(race([]), 156), "08:36")
assert.equal(timeLabel(race([], { startTime: null }), 156), "2h36")

// fmtSigned: sign always shown, minus sign is U+2212
assert.equal(fmtSigned(2.4), "+2 g")
assert.equal(fmtSigned(-3), "−3 g")
assert.equal(fmtSigned(0), "±0 g")

console.log("printPlan.check OK")
