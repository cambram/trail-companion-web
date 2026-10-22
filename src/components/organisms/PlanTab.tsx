import { Plus } from "lucide-react"
import { Fragment, useState } from "react"

import { AidStationCard } from "@/components/organisms/AidStationCard"
import { CourseStrip } from "@/components/organisms/CourseStrip"
import { PlanInsights } from "@/components/organisms/PlanInsights"
import { SegmentCard } from "@/components/organisms/SegmentCard"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { useRace } from "@/hooks/useRace"
import { avgEffortPace, effortCue, segmentStats } from "@/lib/planInsights"
import { allocate, checkpoints, etas, legs, planMismatch } from "@/lib/planMath"
import type { NutritionItem, RaceDetail } from "@/lib/racesApi"

type Actions = Pick<
  ReturnType<typeof useRace>,
  | "patchSegment" | "moveSegment" | "moveItem" | "addItem" | "deleteItem" | "deleteSegment"
  | "patchAidStation" | "addAidStation" | "deleteAidStation" | "moveAidStation"
  | "addStationItem" | "deleteStationItem" | "moveStationItem"
  | "addReminderItem" | "deleteReminderItem" | "moveReminderItem"
>

type Props = {
  race: RaceDetail
  library: NutritionItem[] | undefined
  newId: string | undefined
  adding: boolean
  onAddSegment: () => void
  run: (fn: () => Promise<unknown>) => Promise<void>
  guarded: (fn: () => Promise<unknown>) => Promise<void>
  actions: Actions
}

/** Course strip, insights and the editable segment and aid station cards. */
export function PlanTab({ race, library, newId, adding, onAddSegment, run, guarded, actions: x }: Props) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(race.segments[0] ? [race.segments[0].id] : []))
  const [seenNew, setSeenNew] = useState(newId)
  if (newId !== seenNew) {
    setSeenNew(newId)
    if (newId) setOpen(new Set(open).add(newId))
  }
  const toggle = (id: string) =>
    setOpen((o) => {
      const n = new Set(o)
      if (!n.delete(id)) n.add(id)
      return n
    })
  const jump = (segmentId: string) => {
    setOpen((o) => new Set(o).add(segmentId))
    requestAnimationFrame(() =>
      document.getElementById(`seg-${segmentId}`)?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      }),
    )
  }

  const arrivals = etas(race)
  const spans = legs(race.segments)
  const allocs = allocate(race)
  const avg = avgEffortPace(race)
  const mismatch = planMismatch(allocs, race.target)
  const cps = checkpoints(race.segments)
  const shown = new Set(allocs.flatMap((a) => a.reminders.map((r) => r.number)))
  const hidden = race.reminders.filter((r) => !shown.has(r.number)).length
  const hasReminders = allocs.some((a) => a.reminders.length > 0)

  return (
    <div className="grid gap-3.5">
      <CourseStrip race={race} onJump={jump} />
      <PlanInsights race={race} />
      {hasReminders && (
        <p className="px-1 text-[0.8125rem] font-semibold text-muted-foreground">
          Reminders follow your planned times. Off pace? Follow the rules, not the clock.
        </p>
      )}
      {mismatch && (
        <Card>
          <b>Your items don't suit a {race.reminderIntervalMin} minute interval</b>
          <p className="text-[0.8125rem] text-muted-foreground">
            Reminders average {mismatch.avg} g against a target of {race.target} g an hour. An interval of about{" "}
            {mismatch.suggestedIntervalMin} minutes, or smaller items, would fit.
          </p>
        </Card>
      )}
      {race.segments.map((s, i) => {
        const a = s.aidStation
        const stats = segmentStats(s, allocs[i], spans[i])
        return (
          <Fragment key={s.id}>
            {a ? (
              <AidStationCard
                station={a}
                open={open.has(a.id)}
                onToggle={() => toggle(a.id)}
                plannedMin={cps.find((c) => c.stationId === a.id)?.plannedMin ?? 0}
                startTime={race.startTime}
                canMoveUp={i > 1}
                canMoveDown={i < race.segments.length - 1}
                library={library}
                onPatch={(patch) => x.patchAidStation(a.id, patch)}
                onDelete={() => run(() => x.deleteAidStation(a.id))}
                onMove={(d) => x.moveAidStation(a.id, d)}
                onAddItem={(nutritionItemId) => guarded(() => x.addStationItem(a.id, nutritionItemId))}
                onDeleteItem={(itemId) => run(() => x.deleteStationItem(a.id, itemId))}
                onMoveItem={(itemId, d) => x.moveStationItem(a.id, itemId, d)}
              />
            ) : (
              i > 0 && (
                <div className="flex justify-center">
                  <Button
                    variant="quiet"
                    size="sm"
                    className="rounded-full border border-dashed border-line px-3.5"
                    onClick={() => run(() => x.addAidStation(s.id))}
                  >
                    + Aid station
                  </Button>
                </div>
              )
            )}
            <SegmentCard
              index={i}
              open={open.has(s.id)}
              onToggle={() => toggle(s.id)}
              alloc={allocs[i]}
              stats={stats}
              cue={effortCue(stats.effortPace, avg)}
              segments={race.segments}
              count={race.segments.length}
              segment={s}
              target={race.target}
              eta={arrivals[i]}
              leg={spans[i]}
              focusOnMount={s.id === newId}
              library={library}
              onPatch={(patch) => x.patchSegment(s.id, patch)}
              onDelete={() => run(() => x.deleteSegment(s.id))}
              onAddItem={(nutritionItemId) => guarded(() => x.addItem(s.id, nutritionItemId))}
              startTime={race.startTime}
              onAddReminderItem={(n, nutritionItemId) => guarded(() => x.addReminderItem(n, nutritionItemId))}
              onDeleteReminderItem={(n, itemId) => run(() => x.deleteReminderItem(n, itemId))}
              onMoveReminderItem={(n, itemId, d) => x.moveReminderItem(n, itemId, d)}
              onMove={(d) => x.moveSegment(s.id, d)}
              onMoveItem={(itemId, d) => x.moveItem(s.id, itemId, d)}
              onDeleteItem={(itemId) => run(() => x.deleteItem(s.id, itemId))}
            />
          </Fragment>
        )
      })}
      {race.segments.length === 0 && (
        <Card className="items-center py-[26px] text-center">
          <b>No segments yet</b>
          <p className="text-[0.8125rem] text-muted-foreground">Add one for each stretch between aid stations.</p>
        </Card>
      )}
      <Button
        variant="quiet"
        block
        className="min-h-[50px] rounded-full border border-dashed border-line"
        onClick={onAddSegment}
        disabled={adding}
      >
        <Plus aria-hidden />
        Add segment
      </Button>
      {hidden > 0 && (
        <p className="px-1 text-center text-[0.8125rem] text-muted-foreground">
          {hidden} reminder{hidden === 1 ? "" : "s"} outside the planned race time keep their items.
        </p>
      )}
    </div>
  )
}
