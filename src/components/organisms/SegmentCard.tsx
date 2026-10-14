import { ChevronDown, ChevronUp, Tent } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { StatusPill } from "@/components/atoms/StatusPill"
import { ConfirmButton } from "@/components/molecules/ConfirmButton"
import { StatRail } from "@/components/molecules/StatRail"
import { ItemList } from "@/components/organisms/ItemList"
import { ReminderRail } from "@/components/organisms/ReminderRail"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SegmentPatch } from "@/hooks/useRace"
import { fluid, fmtClock, fmtDur, fmtHM, fmtKm, needed, onTarget, paceText, parseAscent, parseDistance, parseDur, planned, stationCarbs, type Leg, type SegmentAlloc } from "@/lib/planMath"
import type { NutritionItem, Segment } from "@/lib/racesApi"
import { cn } from "@/lib/utils"

type Props = {
  alloc: SegmentAlloc
  index: number
  count: number
  segment: Segment
  target: number
  eta: number | null
  leg: Leg
  focusOnMount: boolean
  onPatch: (patch: SegmentPatch) => void
  onDelete: () => void
  onMove: (d: number) => void
  library: NutritionItem[] | undefined
  onAddItem: (nutritionItemId: string) => Promise<void>
  onDeleteItem: (id: string) => void
  onMoveItem: (id: string, d: number) => void
  startTime: string | null
  onAddReminderItem: (number: number, nutritionItemId: string) => Promise<void>
  onDeleteReminderItem: (number: number, id: string) => void
  onMoveReminderItem: (number: number, id: string, d: number) => void
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

export function SegmentCard({ index, count, segment: s, alloc, target, eta, leg, focusOnMount, library, onPatch, onDelete, onMove, onAddItem, onDeleteItem, onMoveItem, startTime, onAddReminderItem, onDeleteReminderItem, onMoveReminderItem }: Props) {
  const [durText, setDurText] = useState(s.duration ? fmtHM(s.duration) : "")
  const [endText, setEndText] = useState(s.endKm !== null ? String(s.endKm) : "")
  const [ascentText, setAscentText] = useState(s.ascentM !== null ? String(s.ascentM) : "")
  const nameRef = useRef<HTMLInputElement>(null)
  const durValid = parseDur(durText) !== null
  const endValid = parseDistance(endText) !== null
  const ascentValid = parseAscent(ascentText) !== null
  const backwards = leg.length !== null && leg.length <= 0

  useEffect(() => {
    if (!focusOnMount) return
    nameRef.current?.scrollIntoView({ block: "center" })
    nameRef.current?.select()
  }, [focusOnMount])

  const p = planned(s, alloc)
  const f = fluid(s, alloc)
  const n = needed(target, s)
  const ok = onTarget(p, n)
  const liquids = library?.filter((item) => item.type === "Liquid")

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

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2.5">
        <Field label="Time" id={`d-${s.id}`}>
          <Input
            id={`d-${s.id}`}
            className="px-2.5 sm:px-3.5"
            inputMode="text"
            autoComplete="off"
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
        <Field label="Ends at (km)" id={`k-${s.id}`}>
          <Input
            id={`k-${s.id}`}
            className="px-2.5 sm:px-3.5"
            inputMode="text"
            autoComplete="off"
            placeholder="e.g. 20"
            aria-invalid={!endValid || backwards}
            aria-describedby={`r-${s.id}`}
            value={endText}
            onChange={(e) => {
              setEndText(e.target.value)
              const v = parseDistance(e.target.value)
              if (v !== null) onPatch({ endKm: e.target.value.trim() ? v : null })
            }}
          />
        </Field>
        <div className="grid gap-1.5">
          <Label>Pace</Label>
          <div className="flex min-h-[46px] items-center rounded-md bg-secondary px-2.5 font-bold whitespace-nowrap sm:px-3.5">
            {paceText(s.duration, leg.length)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-end gap-2.5">
        <Field label="Ascent (m)" id={`a-${s.id}`}>
          <Input
            id={`a-${s.id}`}
            className="px-2.5 sm:px-3.5"
            inputMode="numeric"
            autoComplete="off"
            placeholder="e.g. 600"
            aria-invalid={!ascentValid}
            aria-describedby={`ah-${s.id}`}
            value={ascentText}
            onChange={(e) => {
              setAscentText(e.target.value)
              const v = parseAscent(e.target.value)
              if (v !== null) onPatch({ ascentM: e.target.value.trim() ? v : null })
            }}
          />
        </Field>
        <p id={`ah-${s.id}`} className="pb-3 text-[0.8125rem] font-semibold text-muted-foreground">
          Optional. Sharpens live predictions on race day.
        </p>
      </div>

      <div
        id={`r-${s.id}`}
        className={cn("text-[0.8125rem] font-semibold", backwards ? "text-red" : "text-muted-foreground")}
      >
        {leg.end === null
          ? `Starts at ${fmtKm(leg.start)}`
          : backwards
            ? `Ends at or before its start (${fmtKm(leg.start)})`
            : `${fmtKm(leg.start)} → ${fmtKm(leg.end)} · ${fmtKm(leg.length!)}`}
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

      <ReminderRail
        reminders={alloc.reminders}
        startTime={startTime}
        library={library}
        onAdd={onAddReminderItem}
        onDelete={onDeleteReminderItem}
        onMove={onMoveReminderItem}
      />

      <ItemList
        heading="Carried liquid"
        emptyText="No liquid items in your library."
        items={s.items}
        library={liquids}
        onAdd={onAddItem}
        onDelete={onDeleteItem}
        onMove={onMoveItem}
        lead={
          s.aidStation && (
            <div className="flex items-center gap-2 border-t border-line py-2 text-[0.95rem] font-semibold text-muted-foreground">
              <Tent className="size-4 flex-none" aria-hidden />
              <span className="min-w-0 flex-1 truncate">At {s.aidStation.name.trim() || "aid station"}</span>
              <span className="font-extrabold whitespace-nowrap tabular-nums">{stationCarbs(s)} g</span>
            </div>
          )
        }
      />

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
