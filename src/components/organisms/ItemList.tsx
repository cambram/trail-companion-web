import { ChevronDown, ChevronUp, Plus, X } from "lucide-react"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Item } from "@/lib/racesApi"

type Props = {
  items: Item[]
  onAdd: (name: string, carbs: number) => Promise<void>
  onDelete: (id: string) => void
  onMove: (id: string, d: number) => void
}

export function ItemList({ items, onAdd, onDelete, onMove }: Props) {
  const [name, setName] = useState("")
  const [carbs, setCarbs] = useState("")
  const [badName, setBadName] = useState(false)
  const [badCarbs, setBadCarbs] = useState(false)
  const [pending, setPending] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const carbsRef = useRef<HTMLInputElement>(null)

  async function add() {
    const trimmed = name.trim()
    const c = Number(carbs)
    const nameBad = !trimmed || trimmed.length > 200
    const carbsBad = carbs.trim() === "" || !Number.isInteger(c) || c < 0
    setBadName(nameBad)
    setBadCarbs(carbsBad)
    if (nameBad) return nameRef.current?.focus()
    if (carbsBad) return carbsRef.current?.focus()
    setPending(true)
    try {
      await onAdd(trimmed, c)
      setName("")
      setCarbs("")
    } catch {
      // parent shows the error; keep input so the user can retry
    } finally {
      setPending(false)
      nameRef.current?.focus()
    }
  }

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return
    e.preventDefault()
    add()
  }

  return (
    <div>
      <p className="mb-2 text-xs font-extrabold text-muted-foreground">Nutrition, in order</p>
      {items.length === 0 && (
        <p className="border-t border-line py-2 text-[0.8125rem] text-muted-foreground">Nothing added yet.</p>
      )}
      {items.map((it, k) => (
        <div key={it.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2.5 border-t border-line py-2">
          <span className="min-w-0 truncate text-[0.95rem] font-semibold">{it.name}</span>
          <span className="font-extrabold whitespace-nowrap">{it.carbs} g</span>
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
      <div className="mt-3 grid grid-cols-[1fr_72px_auto] gap-2">
        <Input
          ref={nameRef}
          aria-label="Item name"
          aria-invalid={badName}
          maxLength={200}
          placeholder="Item, e.g. Maurten Gel 160"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setBadName(false)
          }}
          onKeyDown={onEnter}
        />
        <Input
          ref={carbsRef}
          aria-label="Carbs in grams"
          aria-invalid={badCarbs}
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="g"
          value={carbs}
          onChange={(e) => {
            setCarbs(e.target.value)
            setBadCarbs(false)
          }}
          onKeyDown={onEnter}
        />
        <Button variant="iconDark" size="iconLg" aria-label="Add item" disabled={pending} onClick={add}>
          <Plus aria-hidden />
        </Button>
      </div>
    </div>
  )
}
