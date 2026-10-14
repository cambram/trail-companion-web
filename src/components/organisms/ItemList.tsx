import { ChevronDown, ChevronUp, X } from "lucide-react"

import { AddNutrition } from "@/components/molecules/AddNutrition"
import { Button } from "@/components/ui/button"
import type { NutritionItem, PlannedItem } from "@/lib/racesApi"

type Props = {
  items: PlannedItem[]
  library: NutritionItem[] | undefined
  heading?: string | null
  emptyText?: string
  lead?: React.ReactNode
  onAdd: (nutritionItemId: string) => Promise<void>
  onDelete: (id: string) => void
  onMove: (id: string, d: number) => void
}

export function ItemList({ items, library, heading = "Nutrition, in order", emptyText, lead, onAdd, onDelete, onMove }: Props) {
  return (
    <div>
      {heading !== null && <p className="mb-2 text-xs font-extrabold text-muted-foreground">{heading}</p>}
      {lead}
      {items.length === 0 && !lead && (
        <p className="border-t border-line py-2 text-[0.8125rem] text-muted-foreground">Nothing added yet.</p>
      )}
      {items.map((it, k) => (
        <div key={it.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2.5 border-t border-line py-2">
          <span className="min-w-0 truncate text-[0.95rem] font-semibold">{it.name}</span>
          <span className="font-extrabold whitespace-nowrap tabular-nums">
            {it.carbs !== null && `${it.carbs} g`}
            {it.type === "Liquid" && it.size !== null && ` · ${it.size} ml`}
          </span>
          <span className="flex gap-1.5">
            <Button
              variant="icon"
              size="icon"
              className="size-8"
              disabled={k === 0}
              aria-label={`Move ${it.name} earlier`}
              onClick={() => onMove(it.id, -1)}
            >
              <ChevronUp aria-hidden />
            </Button>
            <Button
              variant="icon"
              size="icon"
              className="size-8"
              disabled={k === items.length - 1}
              aria-label={`Move ${it.name} later`}
              onClick={() => onMove(it.id, 1)}
            >
              <ChevronDown aria-hidden />
            </Button>
            <Button variant="icon" size="icon" className="size-8" aria-label={`Remove ${it.name}`} onClick={() => onDelete(it.id)}>
              <X className="size-[15px]" aria-hidden />
            </Button>
          </span>
        </div>
      ))}
      <AddNutrition library={library} onPick={onAdd} emptyText={emptyText} />
    </div>
  )
}
