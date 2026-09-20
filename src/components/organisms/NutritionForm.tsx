import { Plus } from "lucide-react"
import { RadioGroup } from "radix-ui"
import { useState } from "react"

import { ErrorText } from "@/components/atoms/ErrorText"
import { FormField } from "@/components/molecules/FormField"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { NUTRITION_TYPES, sizeUnit } from "@/lib/planMath"
import type { NutritionItem, NutritionItemRequest, NutritionType } from "@/lib/racesApi"

type Props = {
  initial?: NutritionItem
  onSubmit: (body: NutritionItemRequest) => Promise<void>
  onCancel?: () => void
}

const MACROS = [
  ["carbs", "Carbs (g)", false],
  ["calories", "Calories (cal)", false],
  ["caffeine", "Caffeine (mg)", false],
  ["sodium", "Sodium (mg)", true],
  ["potassium", "Potassium (mg)", true],
  ["magnesium", "Magnesium (mg)", true],
  ["calcium", "Calcium (mg)", true],
] as const

type MacroKey = (typeof MACROS)[number][0]

const text = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v))

export function NutritionForm({ initial, onSubmit, onCancel }: Props) {
  const [type, setType] = useState<NutritionType>(initial?.type ?? "Gel")
  const [name, setName] = useState(initial?.name ?? "")
  const [size, setSize] = useState(text(initial?.size))
  const [macros, setMacros] = useState<Record<MacroKey, string>>(() =>
    Object.fromEntries(MACROS.map(([key]) => [key, text(initial?.[key])])) as Record<MacroKey, string>,
  )
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  const sizeLabel = `Size (${sizeUnit(type)})`

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError("Give your nutrition a name")
    if (trimmed.length > 200) return setError("Name is too long (max 200)")

    const fields: [string, string, string, boolean][] = [
      ["size", sizeLabel, size, false],
      ...MACROS.map(([key, label, decimals]) => [key, label, macros[key], decimals] as [string, string, string, boolean]),
    ]

    const numbers: Record<string, number | null> = {}
    for (const [key, label, raw, decimals] of fields) {
      if (raw.trim() === "") {
        numbers[key] = null
        continue
      }
      const n = Number(raw)
      if (!Number.isFinite(n) || n < 0 || (!decimals && !Number.isInteger(n))) {
        return setError(`${label} must be ${decimals ? "" : "a whole number, "}0 or more`)
      }
      numbers[key] = n
    }

    setError(undefined)
    setPending(true)
    try {
      await onSubmit({ name: trimmed, type, ...numbers } as NutritionItemRequest)
      if (!initial) {
        setName("")
        setSize("")
        setMacros(Object.fromEntries(MACROS.map(([key]) => [key, ""])) as Record<MacroKey, string>)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save nutrition")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="grid gap-3">
        <div className="grid gap-1.5">
          <Label>Type</Label>
          <RadioGroup.Root
            value={type}
            onValueChange={(v) => setType(v as NutritionType)}
            aria-label="Nutrition type"
            className="grid grid-cols-4 gap-2"
          >
            {NUTRITION_TYPES.map((t) => (
              <RadioGroup.Item
                key={t}
                value={t}
                className="min-h-10 rounded-full bg-secondary text-[0.8125rem] font-bold text-secondary-foreground outline-none data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              >
                {t}
              </RadioGroup.Item>
            ))}
          </RadioGroup.Root>
        </div>

        <FormField
          label="Name"
          maxLength={200}
          placeholder="e.g. Maurten Gel 100"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <p className="text-[0.8125rem] text-muted-foreground">
          Everything below is optional. Leave a field blank if the label doesn't give it. Sodium, potassium, magnesium
          and calcium take decimals.
        </p>

        <FormField
          label={sizeLabel}
          type="number"
          inputMode="numeric"
          min={0}
          value={size}
          onChange={(e) => setSize(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          {MACROS.map(([key, label, decimals]) => (
            <FormField
              key={key}
              label={label}
              type="number"
              inputMode={decimals ? "decimal" : "numeric"}
              min={0}
              step={decimals ? "any" : 1}
              value={macros[key]}
              onChange={(e) => setMacros((m) => ({ ...m, [key]: e.target.value }))}
            />
          ))}
        </div>

        {error && <ErrorText>{error}</ErrorText>}

        <Button type="submit" block disabled={pending}>
          {!initial && <Plus aria-hidden />}
          {initial ? "Save changes" : "Add nutrition"}
        </Button>
        {onCancel && (
          <Button type="button" variant="quiet" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </form>
    </Card>
  )
}
