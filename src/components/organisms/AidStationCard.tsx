import { ChevronDown, ChevronUp, Tent } from "lucide-react"

import { ConfirmButton } from "@/components/molecules/ConfirmButton"
import { KitList } from "@/components/molecules/KitList"
import { ItemList } from "@/components/organisms/ItemList"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AidStationPatch } from "@/hooks/useRace"
import { arrivalWindow, ARRIVAL_WINDOW } from "@/lib/planInsights"
import { carbsOf, clockToMin, fmtClock, fmtDur } from "@/lib/planMath"
import type { AidStation, NutritionItem } from "@/lib/racesApi"
import { cn } from "@/lib/utils"

type Props = {
  station: AidStation
  open?: boolean
  onToggle?: () => void
  plannedMin: number
  startTime: string | null
  canMoveUp: boolean
  canMoveDown: boolean
  library: NutritionItem[] | undefined
  onPatch: (patch: AidStationPatch) => void
  onDelete: () => void
  onMove: (d: number) => void
  onAddItem: (nutritionItemId: string) => Promise<void>
  onDeleteItem: (id: string) => void
  onMoveItem: (id: string, d: number) => void
}

/** What happens at the stop before a segment. No time of its own: the stop is inside the next segment's time. */
export function AidStationCard({ open = true, onToggle = () => {}, plannedMin, startTime, station: a, canMoveUp, canMoveDown, library, onPatch, onDelete, onMove, onAddItem, onDeleteItem, onMoveItem }: Props) {
  return (
    <Card id={`aid-${a.id}`} className="scroll-mt-20">
      <button
        type="button"
        className="flex w-full items-center gap-2.5 text-left"
        aria-expanded={open}
        aria-controls={`aid-body-${a.id}`}
        onClick={onToggle}
      >
        <span className="grid size-10 flex-none place-items-center rounded-xl bg-violet-soft text-violet" aria-hidden>
          <Tent className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[1.05rem] font-extrabold tracking-[-0.02em]">{a.name.trim() || "Aid station"}</span>
          <span className="block text-xs font-semibold text-muted-foreground">Crew stop · {carbsOf(a.items)} g</span>
        </span>
        <span className="flex-none text-right text-[0.8125rem] font-bold whitespace-nowrap tabular-nums">
          {startTime ? fmtClock(clockToMin(startTime) + plannedMin) : fmtDur(plannedMin)}
        </span>
        <span className="grid size-9 flex-none place-items-center rounded-full bg-secondary" aria-hidden>
          <ChevronDown className={cn("size-5", open && "rotate-180")} />
        </span>
      </button>

      <div id={`aid-body-${a.id}`} hidden={!open} className="grid gap-[inherit]">
      <div className="grid gap-1.5">
        <Label htmlFor={`aname-${a.id}`}>Aid station name</Label>
        <Input
          id={`aname-${a.id}`}
          aria-label="Aid station name"
          aria-invalid={!a.name.trim()}
          maxLength={200}
          placeholder="e.g. Hout Bay"
          value={a.name}
          onChange={(e) => onPatch({ name: e.target.value })}
        />
      </div>

      {startTime && (() => {
        const w = arrivalWindow(plannedMin)
        const base = clockToMin(startTime)
        const pct = Math.round(ARRIVAL_WINDOW * 100)
        return (
          <div className="grid grid-cols-3 overflow-hidden rounded-xl bg-violet-soft text-center">
            {[[`Early −${pct}%`, w.early], ["Planned", w.planned], [`Late +${pct}%`, w.late]].map(([label, min], i) => (
              <div key={label as string} className={cn("px-3 py-2.5", i === 1 && "bg-violet text-card")}>
                <span className="block text-[0.6875rem] font-semibold">{label}</span>
                <b className="tabular-nums">{fmtClock(base + (min as number))}</b>
              </div>
            ))}
          </div>
        )
      })()}

      <ItemList heading="Food & drink" items={a.items} library={library} onAdd={onAddItem} onDelete={onDeleteItem} onMove={onMoveItem} />

      <KitList kit={a.kit} onChange={(kit) => onPatch({ kit })} />

      <div className="grid gap-1.5">
        <Label htmlFor={`an-${a.id}`}>Notes</Label>
        <textarea
          id={`an-${a.id}`}
          maxLength={2000}
          placeholder="Notes for crew, e.g. ~10 min stop"
          className="min-h-[66px] w-full resize-y rounded-md border border-transparent bg-secondary px-3.5 py-[11px] text-base leading-[1.45] font-medium outline-none placeholder:text-muted-foreground"
          value={a.notes}
          onChange={(e) => onPatch({ notes: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-end gap-1">
        <Button variant="icon" size="icon" disabled={!canMoveUp} aria-label="Move aid station up" onClick={() => onMove(-1)}>
          <ChevronUp aria-hidden />
        </Button>
        <Button variant="icon" size="icon" disabled={!canMoveDown} aria-label="Move aid station down" onClick={() => onMove(1)}>
          <ChevronDown aria-hidden />
        </Button>
        <ConfirmButton label="Delete aid station" armedLabel="Tap again to delete" onConfirm={onDelete} />
      </div>
      </div>
    </Card>
  )
}
