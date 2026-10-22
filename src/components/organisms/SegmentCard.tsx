import { ChevronDown, ChevronUp, Mountain, Tent } from "lucide-react"
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
import { fmtClock, fmtDur, fmtHM, fmtKm, fmtPace, needed, onTarget, parseAscent, parseDistance, parseDur, planned, stationCarbs, type Leg, type SegmentAlloc } from "@/lib/planMath"
import type { EffortCue, SegmentStats } from "@/lib/planInsights"
import type { NutritionItem, Segment } from "@/lib/racesApi"
import { cn } from "@/lib/utils"

type Props = {
  alloc: SegmentAlloc
  open?: boolean
  onToggle?: () => void
  stats: SegmentStats
  cue: EffortCue | null
  segments: Segment[]
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

function Chip({ warn, children }: { warn?: boolean; children: React.ReactNode }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", warn ? "bg-amber-soft text-amber" : "bg-secondary text-ink-soft")}>
      {children}
    </span>
  )
}

function Cell({ label, violet, children }: { label: string; violet?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("grid gap-0.5 rounded-xl px-3 py-2.5", violet ? "bg-violet-soft" : "bg-secondary")}>
      <span className={cn("text-[0.6875rem] font-semibold", violet ? "text-violet" : "text-muted-foreground")}>{label}</span>
      <b className="text-[0.9rem] tabular-nums">{children}</b>
    </div>
  )
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

export function SegmentCard({ open = true, onToggle = () => {}, stats, cue, segments, index, count, segment: s, alloc, target, eta, leg, focusOnMount, library, onPatch, onDelete, onMove, onAddItem, onDeleteItem, onMoveItem, startTime, onAddReminderItem, onDeleteReminderItem, onMoveReminderItem }: Props) {
  const [durText, setDurText] = useState(s.duration ? fmtHM(s.duration) : "")
  const [endText, setEndText] = useState(s.endKm !== null ? String(s.endKm) : "")
  const [ascentText, setAscentText] = useState(s.ascentM !== null ? String(s.ascentM) : "")
  const nameRef = useRef<HTMLInputElement>(null)
  const focused = useRef(false)
  const durValid = parseDur(durText) !== null
  const endValid = parseDistance(endText) !== null
  const ascentValid = parseAscent(ascentText) !== null
  const backwards = leg.length !== null && leg.length <= 0

  useEffect(() => {
    if (!focusOnMount || !open || focused.current) return
    focused.current = true
    nameRef.current?.scrollIntoView({ block: "center" })
    nameRef.current?.select()
  }, [focusOnMount, open])

  const p = planned(s, alloc)
  const n = needed(target, s)
  const ok = onTarget(p, n)
  const pill = <StatusPill ok={ok}>{ok ? (p > n ? `${p - n} g over` : "On target") : `${n - p} g short`}</StatusPill>
  const liquids = library?.filter((item) => item.type === "Liquid")

  return (
    <Card id={`seg-${s.id}`} className="scroll-mt-20">
      <button
        type="button"
        className="flex w-full items-center gap-2.5 text-left"
        aria-expanded={open}
        aria-controls={`seg-body-${s.id}`}
        onClick={onToggle}
      >
        <span className="grid size-[38px] flex-none place-items-center rounded-[14px] bg-secondary text-[0.9rem] font-extrabold">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[1.05rem] font-extrabold tracking-[-0.02em]">{s.name.trim() || "Untitled segment"}</span>
          <span className="block text-xs font-semibold text-muted-foreground tabular-nums">
            {stats.distance === null ? "–" : fmtKm(stats.distance)} · ↑{s.ascentM === null ? "–" : Math.round(s.ascentM)} m · {s.duration ? fmtDur(s.duration) : "–"}
          </span>
        </span>
        <span
          className="flex-none text-right text-[0.8125rem] leading-tight font-bold whitespace-nowrap"
          title={eta === null ? "Set a start time to see ETAs" : "Arrival at the end of this segment"}
        >
          <span className="block text-xs font-semibold text-muted-foreground">ETA</span>
          {eta === null ? "–" : fmtClock(eta)}
        </span>
        <span className="grid size-9 flex-none place-items-center rounded-full bg-secondary" aria-hidden>
          <ChevronDown className={cn("size-5", open && "rotate-180")} />
        </span>
      </button>

      {!open && (
        <StatRail planned={p} need={n}>
          {s.duration ? (
            <>
              <span>
                <b>{p} g</b> <span className="text-muted-foreground">of {n} g</span>
              </span>
              {pill}
            </>
          ) : (
            <span className="text-muted-foreground">Add a predicted time to see carbs needed</span>
          )}
        </StatRail>
      )}

      <div id={`seg-body-${s.id}`} hidden={!open} className="grid gap-[inherit]">
      <Field label="Segment name" id={`n-${s.id}`}>
        <Input
          id={`n-${s.id}`}
          ref={nameRef}
          aria-invalid={!s.name.trim()}
          maxLength={200}
          placeholder="e.g. Aid 1 to Aid 2"
          value={s.name}
          onChange={(e) => onPatch({ name: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-end gap-2.5">
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

      <div className="grid grid-cols-3 gap-2">
        <Cell label="Time">{s.duration ? fmtDur(s.duration) : "–"}</Cell>
        <Cell label="Distance">{stats.distance === null ? "–" : fmtKm(stats.distance)}</Cell>
        <Cell label="Pace">{stats.pace === null ? "–" : `${fmtPace(stats.pace)} /km`}</Cell>
        <Cell label="Ascent" violet>{s.ascentM === null ? "–" : `${Math.round(s.ascentM)} m`}</Cell>
        <Cell label="Climb rate" violet>{stats.mPerKm === null ? "–" : `${Math.round(stats.mPerKm)} m/km`}</Cell>
        <Cell label="Effort pace" violet>{stats.effortPace === null ? "–" : `${fmtPace(stats.effortPace)} /km`}</Cell>
      </div>

      {cue && (
        <div className="flex items-start gap-2.5 rounded-xl bg-violet-soft px-3.5 py-3 text-[0.84rem] font-semibold text-violet">
          <Mountain className="mt-0.5 size-5 flex-none" aria-hidden />
          <span>
            {stats.vertPerHour !== null && <b>{Math.round(stats.vertPerHour)} m/h vertical · </b>}
            {cue.kind === "fast"
              ? `${cue.pct}% quicker effort than the race average. Hold back early: bank time, not fatigue.`
              : cue.kind === "slow"
                ? `${cue.pct}% slower effort than the race average. Fatigue is priced in: hike the steeps, run what's runnable.`
                : "Right on the race-average effort. Settle into rhythm."}
          </span>
        </div>
      )}

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
        segments={segments}
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
            {pill}
          </>
        ) : (
          <span className="text-muted-foreground">Add a predicted time to see carbs needed</span>
        )}
      </StatRail>

      <div className="flex flex-wrap gap-1.5">
        {stats.carbsPerHour !== null && <Chip>{Math.round(stats.carbsPerHour)} g/h</Chip>}
        {stats.sodiumPerHour !== null && <Chip>Na {Math.round(stats.sodiumPerHour)} mg/h</Chip>}
        {stats.fluidPerHour !== null && (
          <Chip warn={stats.lowFluid}>
            {Math.round(stats.fluidPerHour)} ml/h{stats.lowFluid ? " · top up at water points" : ""}
          </Chip>
        )}
        {stats.caffeine > 0 && <Chip>Caffeine {stats.caffeine} mg</Chip>}
      </div>

      <div className="flex items-center justify-end gap-1">
        <Button variant="icon" size="icon" disabled={index === 0} aria-label="Move segment up" onClick={() => onMove(-1)}>
          <ChevronUp aria-hidden />
        </Button>
        <Button variant="icon" size="icon" disabled={index === count - 1} aria-label="Move segment down" onClick={() => onMove(1)}>
          <ChevronDown aria-hidden />
        </Button>
        <ConfirmButton label="Delete segment" armedLabel="Tap again to delete" onConfirm={onDelete} />
      </div>
      </div>
    </Card>
  )
}
