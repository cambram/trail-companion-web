import { PrintSheet } from "@/components/molecules/PrintSheet"
import { balanceSeries, insights } from "@/lib/planInsights"
import { checkpoints, raceTotals } from "@/lib/planMath"
import { fmtSigned, timeLabel } from "@/lib/printPlan"
import type { RaceDetail } from "@/lib/racesApi"

const W = 720
const H = 280
const L = 44
const R = 708
const T = 14
const B = 250

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-secondary px-3 py-2">
      <p className="text-[0.6875rem] font-extrabold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="text-xl font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  )
}

export function PrintBalance({ race }: { race: RaceDetail }) {
  const points = balanceSeries(race)
  const totals = raceTotals(race)
  const i = insights(race)
  const hours = totals.duration / 60
  const values = points.map((p) => p.value)
  const pad = (Math.max(0, ...values) - Math.min(0, ...values)) * 0.1 || 10
  const lo = Math.min(0, ...values) - pad
  const hi = Math.max(0, ...values) + pad
  const x = (min: number) => L + (min / (totals.duration || 1)) * (R - L)
  const y = (v: number) => B - ((v - lo) / (hi - lo)) * (B - T)
  const step = hi - lo > 400 ? 100 : 50
  const yTicks: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) yTicks.push(v)
  const xTicks: number[] = []
  for (let m = 0; m <= totals.duration; m += 60) xTicks.push(m)
  const stops = checkpoints(race.segments).filter((c) => c.stationId)
  return (
    <PrintSheet raceName={race.name} kicker="Nutrition audit trail · carb balance" title="Carb balance across the race">
      <p className="mb-3 text-sm text-muted-foreground">
        Each intake is a vertical spike; the line then falls at {race.target} g per hour until the next one. Flask carbs are a slow trickle across their segment. Dashed lines mark aid stations.
      </p>
      {points.length > 0 ? (
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Net carbs against burn over the race" className="print-avoid block h-auto w-full">
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={L} x2={R} y1={y(v)} y2={y(v)} className={v === 0 ? "stroke-foreground" : "stroke-border"} strokeWidth={v === 0 ? 1.5 : 1} />
              <text x={L - 6} y={y(v) + 4} fontSize="11" textAnchor="end" className="fill-muted-foreground">{v}</text>
            </g>
          ))}
          {xTicks.map((m) => (
            <text key={m} x={x(m)} y={B + 18} fontSize="11" textAnchor="middle" className="fill-muted-foreground">{timeLabel(race, m)}</text>
          ))}
          {stops.map((c) => (
            <g key={c.key}>
              <line x1={x(c.plannedMin)} x2={x(c.plannedMin)} y1={T} y2={B} strokeDasharray="4 4" className="stroke-violet" />
              <text x={x(c.plannedMin) + 4} y={T + 10} fontSize="11" className="fill-violet">{c.name}</text>
            </g>
          ))}
          <polyline points={points.map((p) => `${x(p.min)},${y(p.value)}`).join(" ")} fill="none" strokeWidth="2" className="stroke-foreground" />
        </svg>
      ) : (
        <p className="text-sm text-muted-foreground">Add planned time to the segments to see the balance chart.</p>
      )}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <Tile
          label="Lowest point"
          value={i.low ? fmtSigned(i.low.value) : "–"}
          sub={i.low ? `at ${timeLabel(race, i.low.min)}` : "no planned time"}
        />
        <Tile label="Net at finish" value={fmtSigned(i.netAtFinish)} sub={`${Math.round(totals.planned)} g in − ${Math.round((race.target * totals.duration) / 60)} g burned`} />
        <Tile
          label="Average drift"
          value={hours > 0 ? `${i.netAtFinish >= 0 ? "+" : "−"}${Math.abs(Math.round(i.netAtFinish / hours))} g/h` : "–"}
          sub={i.netAtFinish >= 0 ? "upward" : "downward"}
        />
      </div>
      <p className="print-avoid mt-4 text-sm text-muted-foreground">
        How to read this: the model is net intake minus burn, not what is available to your muscles. It ignores glycogen stores (which cover the opening deficit) and gut absorption limits, which sit around 60 to 90 g/h. A rising line means surplus intake, the deliberate buffer for heat. If your stomach turns, the buffer is what you drop first; the line only needs to stay roughly flat.
      </p>
    </PrintSheet>
  )
}
