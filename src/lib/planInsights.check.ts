import assert from "node:assert/strict"

import {
  ARRIVAL_WINDOW, arrivalWindow, ascentProfile, auditTrail, bags, balanceSeries, caffeineAt, caffeineDoses, countItems, crewBrief,
  effortCue, insights, positionAt, reminderState, segmentStats, shoppingList,
} from "./planInsights.ts"
import type { AidStation, NutritionType, PlannedItem, RaceDetail, Segment } from "./racesApi.ts"
import { legs } from "./planMath.ts"

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

// positionAt: interpolates inside a segment, clamps past the end
{
  const segs = [seg(60, 10, 400), seg(60, 20, 200)]
  assert.deepEqual(positionAt(segs, 30), { km: 5, ascent: 200 })
  assert.deepEqual(positionAt(segs, 90), { km: 15, ascent: 500 })
  assert.deepEqual(positionAt(segs, 999), { km: 20, ascent: 600 })
  assert.deepEqual(positionAt([seg(60, null, null)], 30), { km: null, ascent: 0 })
  assert.deepEqual(positionAt([], 30), { km: 0, ascent: 0 })
  assert.deepEqual(positionAt([seg(0, 5, 100)], 0), { km: 5, ascent: 100 })
}

// reminderState
{
  const base = { carbs: 25, target: 25, rule: "full" as const, warning: null }
  assert.equal(reminderState(base), "ok")
  assert.equal(reminderState({ ...base, carbs: 0 }), "empty")
  assert.equal(reminderState({ ...base, carbs: 10 }), "short")
  assert.equal(reminderState({ ...base, carbs: 22 }), "ok")
  assert.equal(reminderState({ ...base, warning: { level: "gentle", over: 9 } }), "over")
  assert.equal(reminderState({ ...base, rule: "skip-before", carbs: 0 }), "skipped")
  assert.equal(reminderState({ ...base, rule: "skip-after", carbs: 20 }), "skip-food")
  assert.equal(reminderState({ ...base, rule: "small", carbs: 20 }), "small")
}

// segmentStats: nulls instead of NaN
{
  const s = seg(0, null, null)
  const st = segmentStats(s, { reminders: [] }, legs([s])[0])
  noNaN(st)
  assert.equal(st.pace, null)
  assert.equal(st.carbsPerHour, null)
  const s2 = seg(120, 20, 600, [it("Flask", 60, { sodium: null }, "Liquid")])
  const st2 = segmentStats(s2, { reminders: [] }, legs([s2])[0])
  assert.equal(st2.pace, 6)
  assert.equal(st2.mPerKm, 30)
  assert.equal(st2.vertPerHour, 300)
  assert.equal(st2.carbsPerHour, 30)
  assert.equal(st2.effortPace, 120 / (20 + 600 / 100))
  assert.equal(st2.sodium, 0)
}

// effortCue
{
  assert.equal(effortCue(null, 6), null)
  assert.deepEqual(effortCue(5, 6), { kind: "fast", pct: 17 })
  assert.deepEqual(effortCue(7, 6), { kind: "slow", pct: 17 })
  assert.deepEqual(effortCue(6.1, 6), { kind: "steady", pct: 2 })
}

// auditTrail: order, boundary reminder, balance
{
  const segs = [seg(60, 10, 100, [], null), seg(60, 20, 100, [], station("Hout"))]
  const r = race(segs, { reminderIntervalMin: 60, reminders: [{ number: 1, items: [] }] })
  const evs = auditTrail(r)
  assert.deepEqual(evs.map((e) => e.kind), ["start", "station", "reminder", "finish"])
  assert.equal(evs[1].min, 60)
  assert.equal(evs[2].min, 60)
  assert.equal(evs[2].segmentIndex, 1)
  assert.equal(evs[2].reminder?.state, "skipped")
  assert.equal(evs[0].balance, 0)
  assert.equal(evs[3].balance, -120)
}

// insights: empty race and blank data never leak non-finite numbers
{
  const empty = insights(race([]))
  noNaN(empty)
  assert.equal(empty.gap, null)
  assert.equal(empty.low, null)
  assert.equal(empty.effortFadePct, null)
  assert.equal(empty.caffeinePeak, null)
  const blank = insights(race([seg(0, null, null), seg(0, null, null)]))
  noNaN(blank)
  assert.equal(blank.climbPerHour, null)
  assert.equal(blank.climbPerKm, null)
}

// insights: gap, attention, fade
{
  const segs = [seg(120, 10, 0, [it("Gel", 60, {}, "Liquid")]), seg(120, 30, 800)]
  const r = race(segs, { reminderIntervalMin: 60, reminders: [{ number: 1, items: [{ ...it("Bar", 40), reminderNumber: 1 }] }] })
  const i = insights(r)
  assert.equal(i.gap?.lenMin, 180)
  assert.equal(i.attention.empty, 2)
  assert.ok((i.effortFadePct ?? 0) > 0)
}

// null item fields count as 0
{
  const flask = it("Flask", null, { caffeine: null, sodium: null }, "Liquid")
  const r = race([seg(60, 5, 10, [flask])])
  noNaN(insights(r))
  assert.deepEqual(caffeineDoses(r), [])
}

// caffeine decays by half every half-life
{
  const doses = [{ min: 0, mg: 100 }]
  assert.equal(caffeineAt(doses, 0), 100)
  assert.equal(Math.round(caffeineAt(doses, 300)), 50)
  assert.equal(caffeineAt(doses, -1), 0)
}

// shopping and counts
{
  const gel = it("Gel", 25)
  const r = race([seg(60, 5, 0, [], null)], { reminderIntervalMin: 30, reminders: [{ number: 1, items: [{ ...gel, reminderNumber: 1 }] }] })
  assert.deepEqual(shoppingList(r).map((x) => [x.name, x.count, x.carbs]), [["Gel", 1, 25]])
  assert.deepEqual(countItems([gel, gel]).map((x) => [x.count, x.carbs]), [[2, 50]])
  assert.equal(bags(r)[0].items.length, 1)
}

// arrival window and brief without a start time
{
  assert.deepEqual(arrivalWindow(100), { early: 100 * (1 - ARRIVAL_WINDOW), planned: 100, late: 100 * (1 + ARRIVAL_WINDOW) })
  const r = race([seg(60, 5, 0), seg(60, 10, 0, [], station("Hout"))], { startTime: null })
  const brief = crewBrief(r)
  assert.ok(brief.includes("Hout"))
  assert.ok(!brief.includes("NaN"))
  assert.ok(brief.includes("1h00"))
  assert.ok(!brief.includes("0h00 into"))
  assert.ok(crewBrief({ ...r, startTime: "06:00:00" }).includes("07:00"))
}

// ascentProfile
{
  assert.equal(ascentProfile([seg(60, null, 100)]), null)
  assert.equal(ascentProfile([seg(60, 10, 0)]), null)
  assert.equal(ascentProfile([]), null)
  const p = ascentProfile([seg(60, 10, 100), seg(60, 20, 50, [], station("A"))])
  assert.deepEqual(p?.points, [[0, 0], [10, 100], [20, 150]])
  assert.deepEqual(p?.stops, [[10, 100]])
}

// balanceSeries: spikes at intakes, ends at netAtFinish, empty without time
{
  const r = race([seg(60, 10, null, [it("Flask", 30, {}, "Liquid")]), seg(60, 20, null)])
  const pts = balanceSeries(r)
  assert.equal(pts[0].min, 0)
  assert.equal(pts.at(-1)!.min, 120)
  assert.equal(pts.at(-1)!.value, insights(r).netAtFinish)
  assert.deepEqual(pts.map((p) => p.min), [...pts.map((p) => p.min)].sort((a, b) => a - b))
  assert.deepEqual(balanceSeries(race([])), [])
  assert.deepEqual(balanceSeries(race([seg(0, null, null)])), [])
  noNaN(pts)
}

console.log("planInsights.check OK")
