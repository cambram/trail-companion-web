import { Tent } from "lucide-react"

import { StatusPill } from "@/components/atoms/StatusPill"
import { ItemList } from "@/components/organisms/ItemList"
import { clockToMin, fmtClock, fmtHM, fmtKm, type AllocatedReminder } from "@/lib/planMath"
import { positionAt, reminderState, type ReminderState } from "@/lib/planInsights"
import type { NutritionItem, Segment } from "@/lib/racesApi"
import type { Tone } from "@/lib/tone"
import { cn } from "@/lib/utils"

const STATE: Record<ReminderState, { tone: Tone; label: (r: AllocatedReminder) => string }> = {
  ok: { tone: "green", label: () => "On target" },
  short: { tone: "red", label: (r) => `${r.target - r.carbs} g short` },
  empty: { tone: "red", label: () => "Nothing planned" },
  over: { tone: "amber", label: (r) => `${r.carbs - r.target} g over` },
  small: { tone: "violet", label: () => "Small" },
  skipped: { tone: "muted", label: () => "Skipped" },
  "skip-food": { tone: "amber", label: () => "Food on a skip" },
}

const NODE: Record<ReminderState, string> = {
  ok: "border-green",
  short: "border-red",
  empty: "border-red",
  over: "border-amber",
  small: "border-violet",
  skipped: "border-dashed border-muted-foreground",
  "skip-food": "border-amber",
}

type Props = {
  reminders: AllocatedReminder[]
  segments: Segment[]
  startTime: string | null
  library: NutritionItem[] | undefined
  onAdd: (number: number, nutritionItemId: string) => Promise<void>
  onDelete: (number: number, id: string) => void
  onMove: (number: number, id: string, d: number) => void
}

export function ReminderRail({ reminders, segments, startTime, library, onAdd, onDelete, onMove }: Props) {
  const counted = reminders.filter((r) => r.rule === "full" || r.rule === "small")
  const active = counted.length
  const total = counted.reduce((t, r) => t + r.carbs, 0)
  return (
    <div>
      <p className="mb-2 text-xs font-extrabold text-muted-foreground">
        From the timeline: {active} reminder{active === 1 ? "" : "s"}, {total} g
      </p>
      {reminders.length === 0 ? (
        <p className="border-t border-line py-2 text-[0.8125rem] text-muted-foreground">No reminder falls in this segment.</p>
      ) : (
        <ol className="ml-[7px] border-l-2 border-line pl-4">
          {reminders.map((r) => {
            const state = reminderState(r)
            const pos = positionAt(segments, r.atMin)
            return (
            <li key={r.number} className="relative grid gap-1.5 pb-4 last:pb-0">
              <span aria-hidden className={cn("absolute top-1.5 -left-[23px] size-3 rounded-full border-[3px] bg-card", NODE[state])} />
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
              <p className="text-xs text-muted-foreground tabular-nums">
                {pos.km === null ? "" : `${fmtKm(pos.km)} · `}↑{Math.round(pos.ascent)} m so far
              </p>
              <div className="justify-self-start">
                <StatusPill tone={STATE[state].tone}>{STATE[state].label(r)}</StatusPill>
              </div>
              {r.station && (state === "skipped" || state === "skip-food") && (
                <p className="text-[0.8125rem] font-semibold text-muted-foreground">
                  {r.rule === "skip-before" ? `${r.station} is close: eat at the aid station.` : `Just left ${r.station}: you've just eaten.`}
                </p>
              )}
              {r.warning?.level === "strong" && (
                <div className="grid justify-items-start gap-1.5">
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
            )
          })}
        </ol>
      )}
    </div>
  )
}
