import { ascentProfile } from "@/lib/planInsights"
import { fmtKm } from "@/lib/planMath"
import type { Segment } from "@/lib/racesApi"

const W = 320
const H = 70

/** Cumulative ascent over distance. Renders nothing until every segment has an end km and the race climbs. */
export function AscentProfile({ segments }: { segments: Segment[] }) {
  const p = ascentProfile(segments)
  if (!p) return null
  const x = (km: number) => 4 + (km / p.totalKm) * (W - 8)
  const y = (a: number) => H - 6 - (a / p.totalAscent) * (H - 16)
  const line = p.points.map(([k, a]) => `${x(k)},${y(a)}`).join(" ")
  return (
    <div className="rounded-xl bg-primary-foreground/10 px-3 pt-3 pb-2">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="opacity-65">Cumulative ascent</span>
        <b>↑ {Math.round(p.totalAscent).toLocaleString("en")} m</b>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Cumulative ascent ${Math.round(p.totalAscent)} metres over ${fmtKm(p.totalKm)}`} className="mt-1 block h-auto w-full">
        <polygon points={`${x(0)},${y(0)} ${line} ${x(p.totalKm)},${y(0)}`} className="fill-violet-soft opacity-30" />
        <polyline points={line} fill="none" strokeWidth="2" strokeLinejoin="round" className="stroke-violet-soft" />
        {p.stops.map(([k, a], i) => (
          <circle key={i} cx={x(k)} cy={y(a)} r="5" strokeWidth="2" className="fill-violet-soft stroke-primary" />
        ))}
        <circle cx={x(p.totalKm)} cy={y(p.totalAscent)} r="4" className="fill-primary-foreground" />
      </svg>
      <div className="mt-1 flex justify-between text-[0.6875rem] opacity-60">
        <span>0 km</span>
        <span>{fmtKm(p.totalKm)}</span>
      </div>
    </div>
  )
}
