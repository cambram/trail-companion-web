import assert from "node:assert/strict"

import { clockToMin, etas, fluid, fmtClock, fmtDur, paceText, parseDistance, parseDur, planned, raceTotals, sizeText, sizeUnit, stationCarbs } from "./planMath.ts"
import type { AidStation, Item, NutritionType, PlannedItem, RaceDetail, Segment } from "./racesApi.ts"

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

const seg = (duration: number, distance: number, items: Item[]): Segment => ({
  id: "",
  position: 0,
  name: "",
  duration,
  distance,
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
  segments: [
    seg(90, 11, [item(40), item(25), item(40)]),
    seg(180, 15, [item(40), item(27), item(24), item(40), item(null), item(50, "Liquid", 500)]),
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
assert.equal(paceText(race.segments[0]), "8:11 /km")
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

console.log("planMath ok")
