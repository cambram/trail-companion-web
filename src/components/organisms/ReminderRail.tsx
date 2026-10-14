import { Tent } from "lucide-react"

import { StatusPill } from "@/components/atoms/StatusPill"
import { ItemList } from "@/components/organisms/ItemList"
import { clockToMin, fmtClock, fmtHM, type AllocatedReminder } from "@/lib/planMath"
import type { NutritionItem } from "@/lib/racesApi"

type Props = {
  reminders: AllocatedReminder[]
  startTime: string | null
  library: NutritionItem[] | undefined
  onAdd: (number: number, nutritionItemId: string) => Promise<void>
  onDelete: (number: number, id: string) => void
  onMove: (number: number, id: string, d: number) => void
}

export function ReminderRail({ reminders, startTime, library, onAdd, onDelete, onMove }: Props) {
  const total = reminders.reduce((t, r) => t + r.carbs, 0)
  return (
    <div>
      <p className="mb-2 text-xs font-extrabold text-muted-foreground">
        From the timeline: {reminders.length} reminder{reminders.length === 1 ? "" : "s"}, {total} g
      </p>
      {reminders.length === 0 ? (
        <p className="border-t border-line py-2 text-[0.8125rem] text-muted-foreground">No reminder falls in this segment.</p>
      ) : (
        <ol className="ml-[7px] border-l-2 border-line pl-4">
          {reminders.map((r) => (
            <li key={r.number} className="relative grid gap-1.5 pb-4 last:pb-0">
              <span aria-hidden className="absolute top-1.5 -left-[23px] size-3 rounded-full border-2 border-line bg-card" />
              <div className="flex items-baseline justify-between gap-2">
                <b className="text-[0.95rem]">
                  {fmtHM(r.atMin)}
                  {startTime && (
                    <span className="ml-1.5 font-semibold text-muted-foreground">{fmtClock(clockToMin(startTime) + r.atMin)}</span>
                  )}
                </b>
                <span className="text-[0.8125rem] font-bold whitespace-nowrap tabular-nums">
                  {r.carbs} g <span className="text-muted-foreground">/ {r.target} g</span>
                </span>
              </div>
              {r.warning?.level === "gentle" && (
                <p className="text-[0.8125rem] font-semibold text-muted-foreground">
                  {r.warning.over} g over your target for this reminder. Just be aware of it.
                </p>
              )}
              {r.warning?.level === "strong" && (
                <div className="grid justify-items-start gap-1.5">
                  <StatusPill ok={false}>{r.warning.over} g over target</StatusPill>
                  <ul className="list-disc pl-5 text-[0.8125rem] font-semibold text-muted-foreground">
                    <li>Skip the next reminder, or take something very small then.</li>
                    <li>Lengthen the reminder interval.</li>
                    <li>Swap this item for a smaller one.</li>
                  </ul>
                </div>
              )}
              {r.nudge && (
                <p className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-muted-foreground">
                  <Tent className="size-3.5 flex-none" aria-hidden />
                  {r.nudge.text}
                </p>
              )}
              <ItemList
                heading={null}
                items={r.items}
                library={library}
                onAdd={(id) => onAdd(r.number, id)}
                onDelete={(id) => onDelete(r.number, id)}
                onMove={(id, d) => onMove(r.number, id, d)}
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
