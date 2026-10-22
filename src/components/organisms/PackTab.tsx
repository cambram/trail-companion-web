import { Card } from "@/components/ui/card"
import { checkId } from "@/lib/checks"
import { bags, caffeineDoses, fmtCounts, insights, segmentStats, shoppingList } from "@/lib/planInsights"
import { allocate, clockToMin, fmtClock, fmtDur, legs } from "@/lib/planMath"
import type { RaceDetail } from "@/lib/racesApi"
import { useTicks } from "@/hooks/useTicks"
import { CaffeineChart } from "@/components/organisms/CaffeineChart"
import { cn } from "@/lib/utils"

const num = (n: number | null) => (n === null ? "–" : String(Math.round(n)))

function Shopping({ race }: { race: RaceDetail }) {
  const { ticks, toggle } = useTicks(`plan-${race.id}`)
  const rows = shoppingList(race)
  return (
    <Card>
      <p className="font-extrabold">Shopping list</p>
      <p className="text-xs text-muted-foreground">Derived from the plan.</p>
      {rows.length === 0 && <p className="text-sm text-muted-foreground">Nothing planned yet.</p>}
      <ul>
        {rows.map((r) => {
          const id = checkId("shop", "item", r.id)
          return (
            <li key={r.id}>
              <label className="flex min-h-8 items-center gap-2.5 py-1 text-[0.95rem] font-semibold">
                <input type="checkbox" className="size-5 flex-none accent-primary" checked={Boolean(ticks[id])} onChange={() => toggle(id)} />
                <span className={cn("min-w-0", ticks[id] && "text-muted-foreground line-through")}>
                  {r.count} × {r.name} <span className="font-normal text-muted-foreground">{Math.round(r.carbs)} g carbs total</span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export function PackTab({ race }: { race: RaceDetail }) {
  if (race.segments.length === 0) {
    return (
      <Card>
        <p className="font-extrabold">Add segments on the Plan tab</p>
        <p className="text-sm text-muted-foreground">The shopping list, bags and per-hour numbers are built from your segments.</p>
      </Card>
    )
  }
  const allocs = allocate(race)
  const spans = legs(race.segments)
  const totalMin = race.segments.reduce((t, s) => t + (s.duration || 0), 0)
  const doses = caffeineDoses(race)
  const totalMg = doses.reduce((t, d) => t + d.mg, 0)
  const peak = insights(race).caffeinePeak
  const start = race.startTime ? clockToMin(race.startTime) : null
  const th = "py-1.5 pr-2 text-left text-xs font-extrabold text-muted-foreground"
  return (
    <div className="space-y-4">
      <Shopping race={race} />
      <Card>
        <p className="font-extrabold">Bags by segment</p>
        <ul className="space-y-2">
          {bags(race).map((b) => (
            <li key={b.segmentIndex} className="text-sm">
              <b>{b.label}</b>
              {b.swapAt && <span className="text-muted-foreground"> · Swap in at {b.swapAt}</span>}
              <p>{fmtCounts(b.items) || "Nothing carried"}</p>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <p className="font-extrabold">Per hour, by segment</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr>
                <th scope="col" className={th}>Seg</th>
                <th scope="col" className={th}>Carbs</th>
                <th scope="col" className={th}>Na</th>
                <th scope="col" className={th}>Fluid</th>
                <th scope="col" className={th}>↑ m/h</th>
              </tr>
            </thead>
            <tbody>
              {race.segments.map((s, i) => {
                const st = segmentStats(s, allocs[i], spans[i])
                return (
                  <tr key={s.id} className="border-t border-border">
                    <td className="py-2 pr-2 font-bold">{i + 1}</td>
                    <td className="py-2 pr-2">{num(st.carbsPerHour)}</td>
                    <td className="py-2 pr-2">{num(st.sodiumPerHour)}</td>
                    <td className={cn("py-2 pr-2", st.lowFluid && "font-semibold text-amber")}>{num(st.fluidPerHour)}</td>
                    <td className="py-2 pr-2">{num(st.vertPerHour)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">Aim ~500–700 mg/h sodium in heat. Drink to thirst: lots of plain water with little sodium risks hyponatraemia.</p>
      </Card>
      {doses.length > 0 && (
        <Card>
          <p className="font-extrabold">Caffeine</p>
          <p className="text-sm font-semibold">{Math.round(totalMg)} mg total</p>
          {peak && (
            <p className="text-xs text-muted-foreground">
              Active caffeine, ~5 h half-life. Peak ~{Math.round(peak.mg)} mg at {start === null ? fmtDur(peak.min) : fmtClock(start + peak.min)}.
            </p>
          )}
          <CaffeineChart doses={doses} totalMin={totalMin} />
        </Card>
      )}
    </div>
  )
}
