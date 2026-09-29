import { useState } from "react"

import { ErrorText } from "@/components/atoms/ErrorText"
import { ConfirmButton } from "@/components/molecules/ConfirmButton"
import { NutritionForm } from "@/components/organisms/NutritionForm"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { NUTRITION_TYPE_CLASSES, sizeText } from "@/lib/planMath"
import type { NutritionItem, NutritionItemRequest } from "@/lib/racesApi"

type Props = {
  item: NutritionItem
  onSave: (body: NutritionItemRequest) => Promise<void>
  onDelete: () => Promise<void>
}

const MACROS = [
  ["carbs", "g carbs"],
  ["calories", "cal"],
  ["caffeine", "mg caffeine"],
  ["sodium", "mg sodium"],
  ["potassium", "mg potassium"],
  ["magnesium", "mg magnesium"],
  ["calcium", "mg calcium"],
] as const

export function NutritionCard({ item, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string>()

  if (editing) {
    return (
      <NutritionForm
        initial={item}
        onCancel={() => setEditing(false)}
        onSubmit={async (body) => {
          await onSave(body)
          setEditing(false)
        }}
      />
    )
  }

  const facts = [sizeText(item), ...MACROS.filter(([key]) => item[key] !== null).map(([key, unit]) => `${item[key]} ${unit}`)]

  return (
    <Card>
      <div className="flex items-start justify-between gap-2.5">
        <span className="min-w-0 text-[1.05rem] font-extrabold tracking-[-0.02em]">{item.name}</span>
        <span className={`flex-none rounded-full px-3 py-[5px] text-xs font-bold ${NUTRITION_TYPE_CLASSES[item.type]}`}>{item.type}</span>
      </div>
      <p className="text-[13px] text-muted-foreground">{facts.filter(Boolean).join(" · ") || "No values recorded"}</p>
      {error && <ErrorText>{error}</ErrorText>}
      <div className="flex justify-end gap-3">
        <Button variant="quiet" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <ConfirmButton
          label="Delete"
          armedLabel="Tap again to delete"
          onConfirm={() => {
            setError(undefined)
            onDelete().catch((e: Error) => setError(e.message))
          }}
        />
      </div>
    </Card>
  )
}
