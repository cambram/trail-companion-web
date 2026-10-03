import { ChevronDown, ChevronUp, Tent } from "lucide-react"

import { ConfirmButton } from "@/components/molecules/ConfirmButton"
import { KitList } from "@/components/molecules/KitList"
import { ItemList } from "@/components/organisms/ItemList"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AidStationPatch } from "@/hooks/useRace"
import type { AidStation, NutritionItem } from "@/lib/racesApi"

type Props = {
  station: AidStation
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
export function AidStationCard({ station: a, canMoveUp, canMoveDown, library, onPatch, onDelete, onMove, onAddItem, onDeleteItem, onMoveItem }: Props) {
  return (
    <Card id={`aid-${a.id}`}>
      <div className="flex items-center gap-2.5">
        <span className="grid size-[38px] flex-none place-items-center" aria-hidden>
          <Tent className="size-5" />
        </span>
        <Input
          aria-label="Aid station name"
          aria-invalid={!a.name.trim()}
          maxLength={200}
          placeholder="e.g. Hout Bay"
          className="min-h-[34px] bg-transparent px-0 py-0 text-[1.05rem] font-extrabold tracking-[-0.02em]"
          value={a.name}
          onChange={(e) => onPatch({ name: e.target.value })}
        />
        <Button variant="icon" size="icon" disabled={!canMoveUp} aria-label="Move aid station up" onClick={() => onMove(-1)}>
          <ChevronUp aria-hidden />
        </Button>
        <Button variant="icon" size="icon" disabled={!canMoveDown} aria-label="Move aid station down" onClick={() => onMove(1)}>
          <ChevronDown aria-hidden />
        </Button>
      </div>

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

      <div className="flex justify-end">
        <ConfirmButton label="Delete aid station" armedLabel="Tap again to delete" onConfirm={onDelete} />
      </div>
    </Card>
  )
}
