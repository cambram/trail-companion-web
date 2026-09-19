import assert from "node:assert/strict"

import { clockToMin, etas, fmtClock, fmtDur, paceText, raceTotals } from "./planMath.ts"
import type { RaceDetail, Segment } from "./racesApi.ts"

const seg = (duration: number, distance: number, carbs: number[]): Segment => ({
  id: "",
  position: 0,
  name: "",
  duration,
  distance,
  notes: "",
  items: carbs.map((c) => ({ id: "", segmentId: "", position: 0, name: "", carbs: c })),
})
const race: RaceDetail = {
  id: "",
  name: "UTCT 55K",
  target: 60,
  startTime: "06:00:00",
  createdAtUtc: "",
  segments: [seg(90, 11, [40, 25, 40]), seg(180, 15, [40, 27, 24, 40])],
}

assert.deepEqual(raceTotals(race), { duration: 270, distance: 26, planned: 236, need: 270 })
assert.equal(fmtDur(270), "4h30")
assert.equal(paceText(race.segments[0]), "8:11 /km")
assert.deepEqual(etas(race).map((m) => fmtClock(m!)), ["07:30", "10:30"])
assert.deepEqual(etas({ ...race, startTime: null }), [null, null])
assert.equal(fmtClock(clockToMin("23:00") + 90), "00:30 +1d")
console.log("planMath ok")
