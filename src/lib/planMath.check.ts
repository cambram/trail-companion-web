import assert from "node:assert/strict"

import { clockToMin, etas, fluid, fmtClock, fmtDur, paceText, raceTotals, sizeText, sizeUnit } from "./planMath.ts"
import type { Item, NutritionType, RaceDetail, Segment } from "./racesApi.ts"

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
})

const race: RaceDetail = {
  id: "",
  name: "UTCT 55K",
  target: 60,
  startTime: "06:00:00",
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
console.log("planMath ok")
