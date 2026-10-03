import { ChevronLeft } from "lucide-react"
import { Fragment, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router"

import { AppFrame } from "@/components/atoms/AppFrame"
import { ErrorText } from "@/components/atoms/ErrorText"
import { ConfirmButton } from "@/components/molecules/ConfirmButton"
import { Hero } from "@/components/organisms/Hero"
import { AidStationCard } from "@/components/organisms/AidStationCard"
import { SegmentCard } from "@/components/organisms/SegmentCard"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useNutrition } from "@/hooks/useNutrition"
import { useRace } from "@/hooks/useRace"
import { ApiError } from "@/lib/api"
import { etas } from "@/lib/planMath"

export default function RacePage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const {
    race, loadError, saveError, patchRace, moveSegment, moveItem, patchSegment, addSegment, deleteSegment, addItem, deleteItem, deleteRace,
    patchAidStation, addAidStation, deleteAidStation, moveAidStation, addStationItem, deleteStationItem, moveStationItem,
  } = useRace(id)
  const { items: library } = useNutrition()
  const [newId, setNewId] = useState<string>()
  const [adding, setAdding] = useState(false)
  const [actionError, setActionError] = useState<string>()

  if (loadError instanceof ApiError && loadError.status === 404) return <Navigate to="/" replace />

  const arrivals = race ? etas(race) : []

  const run = async (fn: () => Promise<unknown>) => {
    setActionError(undefined)
    try {
      await fn()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Something went wrong")
    }
  }

  const onAdd = async () => {
    setAdding(true)
    await run(async () => setNewId(await addSegment()))
    setAdding(false)
  }

  return (
    <AppFrame>
      <header className="flex items-center gap-3 pt-3 pb-[18px]">
        <Link
          to="/"
          aria-label="Back to races"
          className="grid size-[42px] flex-none place-items-center rounded-full bg-card shadow-card"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <div className="flex-1 text-center font-extrabold">Race plan</div>
        <span className="size-[42px]" />
      </header>
      {loadError && <ErrorText>{loadError.message}</ErrorText>}
      {!race && !loadError && <p className="text-[0.8125rem] text-muted-foreground">Loading...</p>}
      {race && (
        <div className="grid gap-3.5">
          <Hero race={race} onPatch={patchRace} onAddSegment={onAdd} adding={adding} />
          {(saveError || actionError) && <ErrorText>{saveError ?? actionError}</ErrorText>}
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
                  count={race.segments.length}
                  segment={s}
                  target={race.target}
                  eta={arrivals[i]}
                  focusOnMount={s.id === newId}
                  library={library}
                  onPatch={(patch) => patchSegment(s.id, patch)}
                  onDelete={() => run(() => deleteSegment(s.id))}
                  onAddItem={async (nutritionItemId) => {
                    setActionError(undefined)
                    try {
                      await addItem(s.id, nutritionItemId)
                    } catch (e) {
                      setActionError(e instanceof Error ? e.message : "Something went wrong")
                      throw e
                    }
                  }}
                  onMove={(d) => moveSegment(s.id, d)}
                  onMoveItem={(itemId, d) => moveItem(s.id, itemId, d)}
                  onDeleteItem={(itemId) => run(() => deleteItem(s.id, itemId))}
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
