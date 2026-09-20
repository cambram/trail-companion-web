import { ChevronDown, ChevronUp } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { StatusPill } from "@/components/atoms/StatusPill"
import { ConfirmButton } from "@/components/molecules/ConfirmButton"
import { StatRail } from "@/components/molecules/StatRail"
import { ItemList } from "@/components/organisms/ItemList"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SegmentPatch } from "@/hooks/useRace"
import { fluid, fmtClock, fmtDur, fmtHM, needed, onTarget, paceText, parseDur, planned } from "@/lib/planMath"
import type { NutritionItem, Segment } from "@/lib/racesApi"

type Props = {
  index: number
  count: number
  segment: Segment
  target: number
  eta: number | null
  focusOnMount: boolean
  onPatch: (patch: SegmentPatch) => void
  onDelete: () => void
  onMove: (d: number) => void
  library: NutritionItem[] | undefined
  onAddItem: (nutritionItemId: string) => Promise<void>
  onDeleteItem: (id: string) => void
  onMoveItem: (id: string, d: number) => void
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

export function SegmentCard({ index, count, segment: s, target, eta, focusOnMount, library, onPatch, onDelete, onMove, onAddItem, onDeleteItem, onMoveItem }: Props) {
  const [durText, setDurText] = useState(s.duration ? fmtHM(s.duration) : "")
  const [distText, setDistText] = useState(s.distance ? String(s.distance) : "")
  const nameRef = useRef<HTMLInputElement>(null)
  const durValid = parseDur(durText) !== null
  const distValid = distText.trim() === "" || Number(distText) >= 0

  useEffect(() => {
    if (!focusOnMount) return
    nameRef.current?.scrollIntoView({ block: "center" })
    nameRef.current?.select()
  }, [focusOnMount])

  const p = planned(s)
  const f = fluid(s)
  const n = needed(target, s)
  const ok = onTarget(p, n)

  return (
    <Card id={`seg-${s.id}`}>
      <div className="flex items-center gap-2.5">
        <span className="grid size-[38px] flex-none place-items-center rounded-[14px] bg-secondary text-[0.9rem] font-extrabold">
          {index + 1}
        </span>
        <Input
          ref={nameRef}
          aria-label="Segment name"
          aria-invalid={!s.name.trim()}
          maxLength={200}
          placeholder="e.g. Aid 1 to Aid 2"
          className="min-h-[34px] bg-transparent px-0 py-0 text-[1.05rem] font-extrabold tracking-[-0.02em]"
          value={s.name}
          onChange={(e) => onPatch({ name: e.target.value })}
        />
        <span
          className="flex-none text-right text-[0.8125rem] leading-tight font-bold whitespace-nowrap"
          title={eta === null ? "Set a start time to see ETAs" : "Arrival at the end of this segment"}
        >
          <span className="block text-xs font-semibold text-muted-foreground">ETA</span>
          {eta === null ? "–" : fmtClock(eta)}
        </span>
        <Button variant="icon" size="icon" disabled={index === 0} aria-label="Move segment up" onClick={() => onMove(-1)}>
          <ChevronUp aria-hidden />
        </Button>
        <Button
          variant="icon"
          size="icon"
          disabled={index === count - 1}
          aria-label="Move segment down"
          onClick={() => onMove(1)}
        >
          <ChevronDown aria-hidden />
        </Button>
      </div>

      <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2.5">
        <Field label="Time" id={`d-${s.id}`}>
          <Input
            id={`d-${s.id}`}
            inputMode="numeric"
            placeholder="3:00"
            aria-invalid={!durValid}
            value={durText}
            onChange={(e) => {
              setDurText(e.target.value)
              const v = parseDur(e.target.value)
              if (v !== null) onPatch({ duration: v })
            }}
            onBlur={() => durValid && setDurText(s.duration ? fmtHM(s.duration) : "")}
          />
        </Field>
        <Field label="Distance" id={`k-${s.id}`}>
          <Input
            id={`k-${s.id}`}
            type="number"
            inputMode="decimal"
            min={0}
            step={0.1}
            placeholder="15 km"
            aria-invalid={!distValid}
            value={distText}
            onChange={(e) => {
              setDistText(e.target.value)
              const v = e.target.value.trim() === "" ? 0 : Number(e.target.value)
              if (v >= 0) onPatch({ distance: v })
            }}
          />
        </Field>
        <div className="grid gap-1.5">
          <Label>Pace</Label>
          <div className="flex min-h-[46px] items-center rounded-md bg-secondary px-3.5 font-bold whitespace-nowrap">
            {paceText(s)}
          </div>
        </div>
      </div>

      <Field label="Pacing plan" id={`p-${s.id}`}>
        <textarea
          id={`p-${s.id}`}
          maxLength={2000}
          placeholder="e.g. Hike the climbs, run the flats"
          className="min-h-[66px] w-full resize-y rounded-md border border-transparent bg-secondary px-3.5 py-[11px] text-base leading-[1.45] font-medium outline-none placeholder:text-muted-foreground"
          value={s.notes}
          onChange={(e) => onPatch({ notes: e.target.value })}
        />
      </Field>

      <ItemList items={s.items} library={library} onAdd={onAddItem} onDelete={onDeleteItem} onMove={onMoveItem} />

      <StatRail planned={p} need={n}>
        {s.duration ? (
          <>
            <span>
              <b>{p} g</b>{" "}
              <span className="text-muted-foreground">
                of {n} g, {fmtDur(s.duration)} at {target} g/h
              </span>
            </span>
            <StatusPill ok={ok}>{ok ? (p > n ? `${p - n} g over` : "On target") : `${n - p} g short`}</StatusPill>
          </>
        ) : (
          <span className="text-muted-foreground">Add a predicted time to see carbs needed</span>
        )}
      </StatRail>

      {f > 0 && <div className="text-[0.8125rem] font-semibold text-muted-foreground">Fluid {f} ml</div>}

      <div className="flex justify-end">
        <ConfirmButton label="Delete segment" armedLabel="Tap again to delete" onConfirm={onDelete} />
      </div>
    </Card>
  )
}
