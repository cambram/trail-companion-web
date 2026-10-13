import assert from "node:assert/strict"

import { checkpoints, clockToMin, crewStops, kitLabel, prepFor, etas, finishSummary, fluid, fmtBehind, fmtClock, fmtDur, fmtInstant, fmtKm, lastRecorded, legs, nearestInstant, nextCheckpoint, onCourse, pacingOptions, prediction, segmentResult, startLock, paceText, parseDistance, parseDur, planned, raceTotals, sizeText, sizeUnit, stationCarbs, timeline, zonedDate, zonedToMs } from "./planMath.ts"
import { checkId, parseChecks } from "./checks.ts"
import type { AidStation, AidStationItem, Item, NutritionType, PlannedItem, RaceDetail, Run, Segment } from "./racesApi.ts"

const item = (carbs: number | null, type: NutritionType = "Gel", size: number | null = null): Item => ({
  id: "",
  segmentId: "",
  nutritionItemId: "",
  position: 0,
  name: "",
  type,
  size,
  carbs,
  calories: null,
  caffeine: null,
  sodium: null,
  potassium: null,
  magnesium: null,
  calcium: null,
})

const seg = (duration: number, endKm: number | null, items: Item[]): Segment => ({
  id: "",
  position: 0,
  name: "",
  duration,
  endKm,
  notes: "",
  items,
  aidStation: null,
})

const race: RaceDetail = {
  id: "",
  name: "UTCT 55K",
  target: 60,
  startTime: "06:00:00",
  raceDate: null,
  createdAtUtc: "",
  role: "Owner",
  pin: null,
  segments: [
    seg(90, 11, [item(40), item(25), item(40)]),
    seg(180, 26, [item(40), item(27), item(24), item(40), item(null), item(50, "Liquid", 500)]),
  ],
}

assert.deepEqual(raceTotals(race), { duration: 270, distance: 26, planned: 286, need: 270, fluid: 500 })
assert.equal(fluid(race.segments[0]), 0)
assert.equal(fluid(seg(0, 0, [item(50, "Liquid", null), item(50, "Liquid", 250)])), 250)
assert.equal(sizeUnit("Liquid"), "ml")
assert.equal(sizeUnit("Pill"), "mg")
assert.equal(sizeUnit("Solid"), "g")
assert.equal(sizeText({ type: "Liquid", size: 500 }), "500 ml")
assert.equal(sizeText({ type: "Gel", size: null }), "")
assert.equal(fmtDur(270), "4h30")
assert.equal(paceText(90, 11), "8:11 /km")
assert.deepEqual(etas(race).map((m) => fmtClock(m!)), ["07:30", "10:30"])
assert.deepEqual(etas({ ...race, startTime: null }), [null, null])
assert.equal(fmtClock(clockToMin("23:00") + 90), "00:30 +1d")
for (const v of ["3:30", "3.30", "3,30", "3 30", "330", "0330", " 3:30 "]) assert.equal(parseDur(v), 210, v)
assert.equal(parseDur("3.30"), 210, "3.30 is 3 h 30 min, a duration, not 3.3 decimal hours (198)")
assert.equal(parseDur("3"), 180)
assert.equal(parseDur(""), 0)
for (const v of ["3:75", "abc", "-1", "25:00", "3:5", "3.5"]) assert.equal(parseDur(v), null, v)

for (const [v, km] of [["12.5", 12.5], ["12,5", 12.5], [" 12 ", 12], ["12.", 12], [".5", 0.5], ["", 0]] as const)
  assert.equal(parseDistance(v), km, v)
for (const v of ["-1", "abc", "1,2,3", "1.2.3", "1e3"]) assert.equal(parseDistance(v), null, v)

const station = (items: PlannedItem[]): AidStation => ({
  id: "",
  name: "Hout Bay",
  notes: "",
  kit: [],
  items: items.map((i) => ({ ...i, aidStationId: "" })),
})

const fed: Segment = { ...seg(120, 10, [item(40), item(25)]), aidStation: station([item(30), item(15, "Liquid", 200), item(null)]) }
assert.equal(stationCarbs(fed), 45)
assert.equal(planned(fed), 110, "station carbs count in the segment after the station; null carbs count as 0")
assert.equal(fluid(fed), 200)
assert.equal(stationCarbs(race.segments[0]), 0)
assert.equal(planned(race.segments[0]), 105, "no station gives the old total")

const raceWithStation: RaceDetail = {
  ...race,
  segments: [race.segments[0], { ...race.segments[1], aidStation: station([item(45)]) }],
}
assert.deepEqual(raceTotals(raceWithStation), { duration: 270, distance: 26, planned: 331, need: 270, fluid: 500 })
assert.deepEqual(etas(raceWithStation), etas(race), "stations never change ETAs")
const swapped: RaceDetail = { ...raceWithStation, segments: [...raceWithStation.segments].reverse() }
assert.deepEqual(
  etas(swapped).map((m) => fmtClock(m!)),
  ["09:00", "10:30"],
  "reordering segments carries stations and ETAs follow durations only",
)

const at = (...ends: (number | null)[]) => legs(ends.map((endKm) => ({ endKm })))
assert.deepEqual(
  at(10, 20, 32),
  [
    { start: 0, end: 10, length: 10 },
    { start: 10, end: 20, length: 10 },
    { start: 20, end: 32, length: 12 },
  ],
  "worked example from the spec",
)
assert.deepEqual(at(), [])
assert.deepEqual(
  at(10, null, 32).map((l) => [l.start, l.length]),
  [[0, 10], [10, null], [10, 22]],
  "blank end has no length; the next segment starts at the last entered end",
)
assert.deepEqual(at(10, 21, 32).map((l) => l.length), [10, 11, 11], "editing one end changes only it and the next segment")
assert.equal(at(10, 20.1)[1].length, 10.1, "no float noise")
assert.equal(fmtKm(at(10, 20.1)[1].length!), "10.1 km")
assert.equal(fmtKm(32), "32 km")
assert.equal(at(20, 10)[1].length, -10, "out of order stays negative so the card can flag it")
assert.equal(paceText(60, -10), "– /km")
assert.equal(paceText(60, null), "– /km")
assert.equal(paceText(0, 10), "– /km")
assert.equal(
  raceTotals({ ...race, segments: [seg(0, 32, []), seg(0, 20, []), seg(0, null, [])] }).distance,
  32,
  "race distance is the furthest mark, even out of order",
)

{
  const station = (name: string): AidStation => ({
    id: name,
    name,
    notes: "",
    kit: [{ label: "Socks", certainty: "Planned" }],
    items: [],
  })
  const first = seg(180, 18, [item(40)])
  const second = { ...seg(120, 30, [item(25), item(25)]), aidStation: station("AS1") }
  const third = seg(60, 40, [])

  const stops = crewStops({ startTime: "06:00:00", segments: [first, second, third] })
  assert.equal(stops.length, 1, "only segments with a station become stops")
  assert.equal(stops[0].station.name, "AS1")
  assert.equal(stops[0].eta, 540, "arrival at a station = end of the segment before it")
  assert.equal(stops[0].packNext.length, 2, "pack list is the following segment's items")

  assert.deepEqual(
    crewStops({ startTime: null, segments: [first, second] }).map((s) => s.eta),
    [null],
    "no start time, no ETA",
  )
  assert.deepEqual(
    crewStops({ startTime: "06:00", segments: [{ ...first, aidStation: station("Start") }] }).map((s) => s.eta),
    [360],
    "a station before the first segment is at the start time",
  )
  assert.deepEqual(crewStops({ startTime: "06:00", segments: [] }), [])
}

const JHB = "Africa/Johannesburg"
const inst = (h: number, m = 0) => Date.UTC(2026, 9, 11, h, m)

const stationAt = (id: string, name: string, kit: AidStation["kit"] = [], items: AidStationItem[] = []): AidStation => ({
  id,
  name,
  notes: "",
  kit,
  items,
})

const utct = (km: (number | null)[] = [18, 30, 44, 55]): Segment[] => [
  { ...seg(180, km[0], []), id: "s1" },
  {
    ...seg(120, km[1], [{ ...item(40), name: "Gel" }]),
    id: "s2",
    aidStation: stationAt(
      "as1",
      "AS1",
      [
        { label: "Socks", certainty: "Planned" },
        { label: "Cap", certainty: "Maybe" },
      ],
      [{ ...item(null), name: "Coke", aidStationId: "as1" }],
    ),
  },
  { ...seg(180, km[2], []), id: "s3", aidStation: stationAt("as2", "AS2") },
  { ...seg(180, km[3], []), id: "s4", aidStation: stationAt("as3", "AS3") },
]

const runOf = (arrivals: [string, number][], startMs = inst(4)): Pick<Run, "startedAtUtc" | "arrivals"> => ({
  startedAtUtc: new Date(startMs).toISOString(),
  arrivals: arrivals.map(([checkpoint, ms]) => ({ checkpoint, arrivedAtUtc: new Date(ms).toISOString() })),
})

{
  assert.equal(fmtInstant(inst(4), JHB), "06:00")
  assert.equal(fmtInstant(Date.UTC(2026, 9, 10, 22, 0), JHB), "00:00", "midnight is 00:00, never 24:00")
  assert.equal(zonedDate(Date.UTC(2026, 9, 10, 22, 0), JHB), "2026-10-11")
  assert.equal(zonedDate(Date.UTC(2026, 9, 10, 21, 59), JHB), "2026-10-10")
  assert.equal(zonedToMs("2026-10-11", "06:00", JHB), inst(4))
  assert.equal(zonedToMs("2026-07-01", "12:00", "America/New_York"), Date.UTC(2026, 6, 1, 16, 0), "works across DST zones")

  const lateNight = zonedToMs("2026-10-11", "23:50", JHB)
  assert.equal(nearestInstant(lateNight, "00:10", JHB), zonedToMs("2026-10-12", "00:10", JHB), "a time typed after midnight lands on the next day")
  assert.equal(nearestInstant(lateNight, "23:55", JHB), zonedToMs("2026-10-11", "23:55", JHB))
}

{
  const cps = checkpoints(utct())
  assert.deepEqual(
    cps.map((c) => [c.key, c.index, c.name, c.plannedMin, c.km]),
    [
      ["as1", 0, "AS1", 180, 18],
      ["as2", 1, "AS2", 300, 30],
      ["as3", 2, "AS3", 480, 44],
      ["finish", 3, "Finish", 660, 55],
    ],
    "a station arrives where the segment before it ends; the finish is last",
  )
  assert.equal(cps[0].stationId, "as1")
  assert.equal(cps[3].stationId, null)

  const atStart = checkpoints([{ ...seg(60, null, []), aidStation: stationAt("x", "X") }, seg(60, null, [])])
  assert.deepEqual(
    atStart.map((c) => [c.key, c.plannedMin, c.km]),
    [
      ["x", 0, 0],
      ["finish", 120, null],
    ],
    "a station before the first segment arrives at the start",
  )
  assert.deepEqual(checkpoints([seg(60, 5, [])]).map((c) => [c.key, c.plannedMin, c.km]), [["finish", 60, 5]])
  assert.deepEqual(checkpoints([]).map((c) => [c.key, c.plannedMin, c.km]), [["finish", 0, null]])

  assert.equal(lastRecorded(cps, runOf([])), null)
  assert.equal(nextCheckpoint(cps, runOf([]))!.key, "as1")
  assert.deepEqual(lastRecorded(cps, runOf([["as2", inst(9, 10)]])), { index: 1, ms: inst(9, 10) })
  assert.equal(nextCheckpoint(cps, runOf([["as2", inst(9, 10)]]))!.key, "as3", "a missed station is not offered again")
  assert.equal(nextCheckpoint(cps, runOf([["finish", inst(15)]])), null)
  assert.equal(lastRecorded(cps, runOf([["gone", inst(9)]])), null, "an arrival for a deleted station is ignored")

  const rows = timeline(cps, runOf([["as1", inst(7, 15)]]))
  assert.deepEqual(rows.map((r) => r.plannedMs), [inst(7), inst(9), inst(12), inst(15)], "planned = actual start + cumulative durations")
  assert.deepEqual(rows.map((r) => r.actualMs), [inst(7, 15), null, null, null])
  assert.deepEqual(rows.map((r) => r.behindMin), [15, null, null, null])
  assert.equal(timeline(cps, runOf([["as1", inst(6, 45)]]))[0].behindMin, -15, "ahead of plan is negative")
  assert.equal(timeline(cps, runOf([["as1", inst(7)]], inst(4, 10)))[0].plannedMs, inst(7, 10), "a late gun shifts the whole plan")
}

{
  const cps = checkpoints(utct())

  assert.equal(fmtBehind(0), "On plan")
  assert.equal(fmtBehind(15), "15 min behind")
  assert.equal(fmtBehind(-15), "15 min ahead")
  assert.equal(fmtBehind(75), "1h15 behind")
  assert.equal(fmtBehind(-60), "1h00 ahead")

  const waiting = onCourse(cps, runOf([]))!
  assert.equal(waiting.next.key, "as1")
  assert.equal(waiting.plannedMs, inst(7), "before AS1 only the planned arrival is known")
  assert.equal(onCourse(cps, runOf([["as1", inst(7, 15)]])), null)
  assert.equal(segmentResult(cps, runOf([])), null, "no card 1 before AS1")
  assert.equal(prediction(cps, runOf([])), null, "no card 2 before AS1")
  assert.equal(pacingOptions(cps, runOf([]), inst(5)), null, "no card 3 before AS1")

  const behind = runOf([["as1", inst(7, 15)]])

  const result = segmentResult(cps, behind)!
  assert.deepEqual(
    { from: result.from, to: result.to, actualMin: result.actualMin, plannedMin: result.plannedMin, behindMin: result.behindMin },
    { from: "Start", to: "AS1", actualMin: 195, plannedMin: 180, behindMin: 15 },
  )
  assert.equal(result.pace, 195 / 18, "pace = minutes per km over the leg")

  const afterTwo = segmentResult(cps, runOf([["as1", inst(7, 15)], ["as2", inst(9, 20)]]))!
  assert.deepEqual([afterTwo.from, afterTwo.to, afterTwo.actualMin, afterTwo.plannedMin, afterTwo.behindMin], ["AS1", "AS2", 125, 120, 20])
  assert.equal(afterTwo.pace, 125 / 12)

  const skipped = segmentResult(cps, runOf([["as2", inst(9, 20)]]))!
  assert.deepEqual([skipped.from, skipped.to, skipped.actualMin, skipped.plannedMin], ["Start", "AS2", 320, 300], "a missed station merges two legs into one result")
  assert.equal(skipped.pace, 320 / 30)

  const guess = prediction(cps, behind)!
  assert.equal(guess.next.key, "as2")
  assert.equal(Math.round(guess.predictedMs), inst(9, 25), "last arrival + 120 min x (195 / 180)")
  assert.equal(guess.plannedMs, inst(9))
  assert.equal(guess.ratio, 195 / 180)
  assert.equal(prediction(cps, runOf([["finish", inst(15)]])), null, "nothing to predict after the finish")

  const slow = pacingOptions(cps, behind, inst(7, 30))!
  assert.equal(slow.next.key, "as2")
  assert.equal(slow.behindMin, 15)
  assert.deepEqual(slow.a, { plannedMs: inst(9), availableMin: 105, achievable: true, requiredPace: 105 / 12 })
  assert.deepEqual(slow.b, { arrivalMs: inst(9, 15), legMin: 120, plannedPace: 10 })

  const passed = pacingOptions(cps, behind, inst(9))!
  assert.equal(passed.a.achievable, false, "option A is not achievable once its planned time has passed")
  assert.equal(passed.a.requiredPace, null)
  assert.equal(passed.b.arrivalMs, inst(9, 15), "option B does not care")

  const early = pacingOptions(cps, runOf([["as1", inst(6, 45)]]), inst(7))!
  assert.equal(early.behindMin, -15)
  assert.deepEqual(early.a, { plannedMs: inst(9), availableMin: 135, achievable: true, requiredPace: 135 / 12 })
  assert.equal(early.b.arrivalMs, inst(8, 45))

  const noKm = checkpoints(utct([null, null, null, null]))
  assert.equal(segmentResult(noKm, behind)!.pace, null, "no EndKm, no pace")
  const noKmPacing = pacingOptions(noKm, behind, inst(7, 30))!
  assert.equal(noKmPacing.a.requiredPace, null)
  assert.equal(noKmPacing.b.plannedPace, null)
  assert.equal(noKmPacing.a.availableMin, 105, "times still work without distances")
  assert.equal(Math.round(prediction(noKm, behind)!.predictedMs), inst(9, 25))

  const atStart = checkpoints([{ ...seg(60, null, []), aidStation: stationAt("x", "X") }, seg(60, null, [])])
  const zero = runOf([["x", inst(4, 10)]])
  assert.equal(prediction(atStart, zero)!.ratio, 1, "planned elapsed 0 falls back to ratio 1")
  assert.equal(Math.round(prediction(atStart, zero)!.predictedMs), inst(6, 10))
  const zeroResult = segmentResult(atStart, zero)!
  assert.deepEqual([zeroResult.plannedMin, zeroResult.behindMin, zeroResult.pace], [0, 10, null], "a zero-length leg has no pace")
  assert.equal(Number.isFinite(pacingOptions(atStart, zero, inst(4, 11))!.b.legMin), true)

  const done = { ...runOf([["as1", inst(7, 15)], ["finish", inst(15, 12)]]), finishedAtUtc: new Date(inst(15, 12)).toISOString() }
  assert.deepEqual(finishSummary(cps, done), { totalMin: 672, plannedMin: 660, behindMin: 12 })
  assert.equal(finishSummary(cps, { ...done, finishedAtUtc: null }), null)

  const lockRace = { raceDate: "2026-10-11", segments: utct() }
  assert.equal(startLock(lockRace, { today: "2026-10-11", canStart: true }), null)
  assert.match(startLock(lockRace, { today: "2026-10-10", canStart: false })!, /opens on race day, 2026-10-11/)
  assert.match(startLock(lockRace, { today: "2026-10-12", canStart: false })!, /has passed/)
  assert.match(startLock({ raceDate: null, segments: utct() }, { today: "2026-10-11", canStart: false })!, /Set the race date/)
  assert.match(startLock({ raceDate: "2026-10-11", segments: [] }, { today: "2026-10-11", canStart: true })!, /at least one segment/)
}

{
  const segs = utct()
  const cps = checkpoints(segs)

  assert.equal(kitLabel({ label: "Socks", certainty: "Planned" }), "Socks")
  assert.equal(kitLabel({ label: "Cap", certainty: "Maybe" }), "Cap (maybe)")

  assert.deepEqual(prepFor(cps[0], segs), {
    station: "AS1",
    kit: ["Socks", "Cap (maybe)"],
    food: ["Coke"],
    packNext: ["Gel"],
  })
  assert.deepEqual(prepFor(cps[1], segs), { station: "AS2", kit: [], food: [], packNext: [] })
  assert.equal(prepFor(cps[3], segs), null, "nothing to prepare at the finish")
  assert.equal(prepFor(null, segs), null)

  assert.deepEqual(parseChecks(null), {})
  assert.deepEqual(parseChecks("not json"), {})
  assert.deepEqual(parseChecks("[1,2]"), {})
  assert.deepEqual(parseChecks('{"a":true,"b":false,"c":1}'), { a: true }, "only ticked entries survive")
  assert.equal(checkId("as1", "kit", 2), "as1:kit:2")
}

console.log("planMath ok")
