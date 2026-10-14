import { Users } from "lucide-react"
import { Fragment, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router"

import { AppFrame } from "@/components/atoms/AppFrame"
import { ErrorText } from "@/components/atoms/ErrorText"
import { useAuth } from "@/auth/AuthContext"
import { BackHeader } from "@/components/molecules/BackHeader"
import { ConfirmButton } from "@/components/molecules/ConfirmButton"
import { CrewPlan } from "@/components/organisms/CrewPlan"
import { Hero } from "@/components/organisms/Hero"
import { AidStationCard } from "@/components/organisms/AidStationCard"
import { SegmentCard } from "@/components/organisms/SegmentCard"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useNutrition } from "@/hooks/useNutrition"
import { useRace } from "@/hooks/useRace"
import { ApiError } from "@/lib/api"
import { allocate, etas, legs, planMismatch } from "@/lib/planMath"
import { racesApi } from "@/lib/racesApi"

export default function RacePage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const {
    race, loadError, saveError, patchRace, moveSegment, moveItem, patchSegment, addSegment, deleteSegment, addItem, deleteItem, deleteRace,
    patchAidStation, addAidStation, deleteAidStation, moveAidStation, addStationItem, deleteStationItem, moveStationItem,
    addReminderItem, deleteReminderItem, moveReminderItem,
  } = useRace(id)
  const { user, authFetch } = useAuth()
  const { items: library } = useNutrition()
  const [newId, setNewId] = useState<string>()
  const [adding, setAdding] = useState(false)
  const [actionError, setActionError] = useState<string>()

  if (loadError instanceof ApiError && loadError.status === 404) return <Navigate to="/" replace />

  const arrivals = race ? etas(race) : []
  const spans = race ? legs(race.segments) : []
  const allocs = race ? allocate(race) : []
  const mismatch = race ? planMismatch(allocs, race.target) : null
  const shown = new Set(allocs.flatMap((a) => a.reminders.map((r) => r.number)))
  const hidden = race ? race.reminders.filter((x) => !shown.has(x.number)).length : 0
  const hasReminders = allocs.some((a) => a.reminders.length > 0)

  const run = async (fn: () => Promise<unknown>) => {
    setActionError(undefined)
    try {
      await fn()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Something went wrong")
    }
  }

  const guarded = async (fn: () => Promise<unknown>) => {
    setActionError(undefined)
    try {
      await fn()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Something went wrong")
      throw e
    }
  }

  if (race?.role === "Crew")
    return (
      <AppFrame>
        <BackHeader to="/" label="Back to races" title="Crew view" />
        <Link to={`/races/${id}/live`} className={`${buttonVariants({ variant: "default", block: true })} mb-3.5`}>
          Live tracking
        </Link>
        <CrewPlan race={race} />
        {actionError && <ErrorText>{actionError}</ErrorText>}
        <div className="mt-4 flex justify-center">
          <ConfirmButton
            label="Leave crew"
            armedLabel="Tap again to leave this crew"
            onConfirm={() =>
              run(async () => {
                await racesApi(authFetch).removeCrew(race.id, user!.id)
                navigate("/")
              })
            }
          />
        </div>
      </AppFrame>
    )

  const onAdd = async () => {
    setAdding(true)
    await run(async () => setNewId(await addSegment()))
    setAdding(false)
  }

  return (
    <AppFrame>
      <BackHeader to="/" label="Back to races" title="Race plan">
        <Link
          to={`/races/${id}/share`}
          aria-label="Share with crew"
          className="grid size-[42px] flex-none place-items-center rounded-full bg-card shadow-card"
        >
          <Users className="size-5" aria-hidden />
        </Link>
      </BackHeader>
      {loadError && <ErrorText>{loadError.message}</ErrorText>}
      {!race && !loadError && <p className="text-[0.8125rem] text-muted-foreground">Loading...</p>}
      {race && (
        <div className="grid gap-3.5">
          <Hero race={race} onPatch={patchRace} onAddSegment={onAdd} adding={adding} />
          <Link to={`/races/${id}/live`} className={buttonVariants({ variant: "secondary", block: true })}>
            Live tracking
          </Link>
          {(saveError || actionError) && <ErrorText>{saveError ?? actionError}</ErrorText>}
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
            return (
              <Fragment key={s.id}>
                {a ? (
                  <AidStationCard
                    key={a.id}
                    station={a}
                    canMoveUp={i > 1}
                    canMoveDown={i < race.segments.length - 1}
                    library={library}
                    onPatch={(patch) => patchAidStation(a.id, patch)}
                    onDelete={() => run(() => deleteAidStation(a.id))}
                    onMove={(d) => moveAidStation(a.id, d)}
                    onAddItem={async (nutritionItemId) => {
                      setActionError(undefined)
                      try {
                        await addStationItem(a.id, nutritionItemId)
                      } catch (e) {
                        setActionError(e instanceof Error ? e.message : "Something went wrong")
                        throw e
                      }
                    }}
                    onDeleteItem={(itemId) => run(() => deleteStationItem(a.id, itemId))}
                    onMoveItem={(itemId, d) => moveStationItem(a.id, itemId, d)}
                  />
                ) : (
                  i > 0 && (
                    <div className="flex justify-center">
                      <Button
                        variant="quiet"
                        size="sm"
                        className="rounded-full border border-dashed border-line px-3.5"
                        onClick={() => run(() => addAidStation(s.id))}
                      >
                        + Aid station
                      </Button>
                    </div>
                  )
                )}
                <SegmentCard
                  index={i}
                  alloc={allocs[i]}
                  count={race.segments.length}
                  segment={s}
                  target={race.target}
                  eta={arrivals[i]}
                  leg={spans[i]}
                  focusOnMount={s.id === newId}
                  library={library}
                  onPatch={(patch) => patchSegment(s.id, patch)}
                  onDelete={() => run(() => deleteSegment(s.id))}
                  onAddItem={(nutritionItemId) => guarded(() => addItem(s.id, nutritionItemId))}
                  startTime={race.startTime}
                  onAddReminderItem={(n, nutritionItemId) => guarded(() => addReminderItem(n, nutritionItemId))}
                  onDeleteReminderItem={(n, itemId) => run(() => deleteReminderItem(n, itemId))}
                  onMoveReminderItem={(n, itemId, d) => moveReminderItem(n, itemId, d)}
                  onMove={(d) => moveSegment(s.id, d)}
                  onMoveItem={(itemId, d) => moveItem(s.id, itemId, d)}
                  onDeleteItem={(itemId) => run(() => deleteItem(s.id, itemId))}
                />
              </Fragment>
            )
          })}
          {hidden > 0 && (
            <p className="px-1 text-center text-[0.8125rem] text-muted-foreground">
              {hidden} reminder{hidden === 1 ? "" : "s"} outside the planned race time keep their items.
            </p>
          )}
          {race.segments.length === 0 && (
            <Card className="items-center py-[26px] text-center">
              <b>No segments yet</b>
              <p className="text-[0.8125rem] text-muted-foreground">Add one for each stretch between aid stations.</p>
            </Card>
          )}
          <div className="mt-2 flex justify-center">
            <ConfirmButton
              label="Delete race"
              armedLabel="Tap again to delete this race"
              onConfirm={() =>
                run(async () => {
                  await deleteRace()
                  navigate("/")
                })
              }
            />
          </div>
        </div>
      )}
    </AppFrame>
  )
}
