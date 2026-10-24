import { PrintSheet } from "@/components/molecules/PrintSheet"
import { bags, caffeineDoses, fmtCounts, shoppingList } from "@/lib/planInsights"
import { timeLabel } from "@/lib/printPlan"
import type { RaceDetail } from "@/lib/racesApi"

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="print-avoid">
      <p className="mb-1 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">{title}</p>
      {children}
    </div>
  )
}

export function PrintPrep({ race }: { race: RaceDetail }) {
  const doses = caffeineDoses(race)
  const total = Math.round(doses.reduce((a, d) => a + d.mg, 0))
  return (
    <PrintSheet raceName={race.name} kicker="Before the race" title="Shopping & packing">
      <div className="grid grid-cols-2 gap-6">
        <Block title="Shopping">
          <ul className="grid gap-1 text-sm">
            {shoppingList(race).map((x) => (
              <li key={x.id}>
                {x.count} × {x.name}
              </li>
            ))}
          </ul>
        </Block>
        <Block title="Race pack, by segment">
          <ul className="grid gap-2 text-sm">
            {bags(race).map((b) => (
              <li key={b.segmentIndex}>
                <p className="font-bold">{b.swapAt ? `${b.swapAt} bag` : b.label}</p>
                <p className="text-muted-foreground">{fmtCounts(b.items) || "Nothing planned"}</p>
              </li>
            ))}
          </ul>
        </Block>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-6">
        <Block title="Flasks, every segment">
          <ul className="grid gap-2 text-sm">
            {race.segments.map((s, i) => (
              <li key={s.id}>
                <p className="font-bold">{s.name.trim() || `Segment ${i + 1}`}</p>
                {s.items.length === 0 ? (
                  <p className="text-muted-foreground">No flask</p>
                ) : (
                  s.items.map((f) => (
                    <p key={f.id} className="text-muted-foreground">
                      {f.name}
                      {f.carbs !== null && ` · ${f.carbs} g`}
                      {f.sodium !== null && ` · ${Math.round(f.sodium)} mg Na`}
                    </p>
                  ))
                )}
              </li>
            ))}
          </ul>
        </Block>
        <Block title={`Caffeine · ~${total} mg`}>
          {doses.length === 0 ? (
            <p className="text-sm text-muted-foreground">None planned</p>
          ) : (
            <ul className="grid gap-1 text-sm tabular-nums">
              {doses.map((d, i) => (
                <li key={i}>
                  {timeLabel(race, d.min)} · {Math.round(d.mg)} mg
                </li>
              ))}
            </ul>
          )}
        </Block>
      </div>
    </PrintSheet>
  )
}
