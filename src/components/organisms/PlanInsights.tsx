import { InsightTile } from "@/components/molecules/InsightTile"
import { insights } from "@/lib/planInsights"
import { clockToMin, fmtClock, fmtDur } from "@/lib/planMath"
import type { RaceDetail } from "@/lib/racesApi"

const sg = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${Math.abs(Math.round(n))} g`

/** The prototype's insight grid. Tiles whose data is missing do not render. */
export function PlanInsights({ race }: { race: RaceDetail }) {
  if (race.segments.length === 0) return null
  const i = insights(race)
  const start = race.startTime ? clockToMin(race.startTime) : null
  const at = (min: number) => (start === null ? fmtDur(min) : fmtClock(start + min))
  const { short, skipFood, empty } = i.attention
  const needs = short + skipFood + empty
  const parts = [
    short > 0 ? `${short} under target` : null,
    empty > 0 ? `${empty} empty` : null,
    skipFood > 0 ? `${skipFood} food on a skip` : null,
  ].filter((x) => x !== null)
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {i.gap && (
        <InsightTile tone={i.gap.lenMin > 60 ? "amber" : "green"} label="Longest gap" value={fmtDur(i.gap.lenMin)}>
          No food from {at(i.gap.fromMin)} to {at(i.gap.toMin)}
        </InsightTile>
      )}
      {i.low && (
        <InsightTile tone={i.low.value < -40 ? "amber" : "green"} label="Lowest balance" value={sg(i.low.value)}>
          at {at(i.low.min)}, before the next intake
        </InsightTile>
      )}
      {i.effortFadePct !== null && (
        <InsightTile tone="violet" label="Effort fade" value={`${i.effortFadePct}%`}>
          slowest vs fastest effort pace across segments
        </InsightTile>
      )}
      {i.caffeinePeak && (
        <InsightTile tone="violet" label="Caffeine peak" value={`~${Math.round(i.caffeinePeak.mg)} mg`}>
          active around {at(i.caffeinePeak.min)}
        </InsightTile>
      )}
      {needs > 0 && (
        <InsightTile tone="red" label="Needs attention" value={String(needs)}>
          {parts.join(" · ")}
        </InsightTile>
      )}
      {i.lowFluidSegments > 0 && (
        <InsightTile tone="amber" label="Fluid" value={`${i.lowFluidSegments}/${race.segments.length}`}>
          segments under 600 ml/h. Top up at water points.
        </InsightTile>
      )}
    </div>
  )
}
