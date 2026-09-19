import { ChevronLeft } from "lucide-react"
import { useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router"

import { AppFrame } from "@/components/atoms/AppFrame"
import { ErrorText } from "@/components/atoms/ErrorText"
import { ConfirmButton } from "@/components/molecules/ConfirmButton"
import { Hero } from "@/components/organisms/Hero"
import { SegmentCard } from "@/components/organisms/SegmentCard"
import { Card } from "@/components/ui/card"
import { useRace } from "@/hooks/useRace"
import { ApiError } from "@/lib/api"
import { etas } from "@/lib/planMath"

export default function RacePage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const { race, loadError, saveError, patchRace, moveSegment, moveItem, patchSegment, addSegment, deleteSegment, addItem, deleteItem, deleteRace } =
    useRace(id)
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
          {race.segments.map((s, i) => (
            <SegmentCard
              key={s.id}
              index={i}
              count={race.segments.length}
              segment={s}
              target={race.target}
              eta={arrivals[i]}
              focusOnMount={s.id === newId}
              onPatch={(patch) => patchSegment(s.id, patch)}
              onDelete={() => run(() => deleteSegment(s.id))}
              onAddItem={async (name, carbs) => {
                setActionError(undefined)
                try {
                  await addItem(s.id, name, carbs)
                } catch (e) {
                  setActionError(e instanceof Error ? e.message : "Something went wrong")
                  throw e
                }
              }}
              onMove={(d) => moveSegment(s.id, d)}
              onMoveItem={(itemId, d) => moveItem(s.id, itemId, d)}
              onDeleteItem={(itemId) => run(() => deleteItem(s.id, itemId))}
            />
          ))}
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
