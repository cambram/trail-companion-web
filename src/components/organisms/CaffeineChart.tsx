import { caffeineAt, type Dose } from "@/lib/planInsights"

const W = 360
const H = 110
const L = 8
const R = 352
const T = 10
const B = 90
const STEP = 3

export function CaffeineChart({ doses, totalMin }: { doses: Dose[]; totalMin: number }) {
  if (totalMin <= 0 || doses.length === 0) return null
  const pts: [number, number][] = []
  for (let t = 0; t <= totalMin; t += STEP) pts.push([t, caffeineAt(doses, t)])
  const max = Math.max(50, ...pts.map((p) => p[1])) * 1.15
  const x = (t: number) => L + (t / totalMin) * (R - L)
  const y = (v: number) => B - (v / max) * (B - T)
  const line = pts.map(([t, v]) => `${x(t)},${y(v)}`).join(" ")
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Active caffeine over the race" className="block h-auto w-full">
      <polygon points={`${x(0)},${B} ${line} ${x(totalMin)},${B}`} className="fill-violet opacity-15" />
      <polyline points={line} fill="none" strokeWidth="2" className="stroke-violet" />
      <line x1={L} x2={R} y1={B} y2={B} className="stroke-border" />
      {doses.map((d, i) => (
        <g key={`${i}-${d.min}-${d.mg}`}>
          <circle cx={x(d.min)} cy={B} r="3.5" className="fill-foreground" />
          <text x={x(d.min)} y={B + 14} fontSize="9.5" textAnchor="middle" className="fill-muted-foreground">{d.mg}</text>
        </g>
      ))}
    </svg>
  )
}
