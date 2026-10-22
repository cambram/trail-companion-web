import { Share, Users } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router"

import { AppFrame } from "@/components/atoms/AppFrame"
import { ErrorText } from "@/components/atoms/ErrorText"
import { useAuth } from "@/auth/AuthContext"
import { BackHeader } from "@/components/molecules/BackHeader"
import { TabBar } from "@/components/molecules/TabBar"
import { ConfirmButton } from "@/components/molecules/ConfirmButton"
import { CrewPlan } from "@/components/organisms/CrewPlan"
import { Hero } from "@/components/organisms/Hero"
import { AuditTab } from "@/components/organisms/AuditTab"
import { CrewTab } from "@/components/organisms/CrewTab"
import { PackTab } from "@/components/organisms/PackTab"
import { PlanTab } from "@/components/organisms/PlanTab"
import { Button, buttonVariants } from "@/components/ui/button"
import { useNutrition } from "@/hooks/useNutrition"
import { useRace } from "@/hooks/useRace"
import { ApiError } from "@/lib/api"
import { crewBrief } from "@/lib/planInsights"
import { racesApi } from "@/lib/racesApi"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "plan", label: "Plan" },
  { id: "audit", label: "Audit" },
  { id: "crew", label: "Crew" },
  { id: "pack", label: "Pack" },
]

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
  const [params, setParams] = useSearchParams()
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<number>(undefined)
  useEffect(() => () => window.clearTimeout(copyTimer.current), [])
  const requested = params.get("tab")
  const tab = TABS.some((t) => t.id === requested) ? requested! : "plan"
  const setTab = (t: string) => setParams(t === "plan" ? {} : { tab: t }, { replace: true })
  const copyBrief = async () => {
    if (!race) return
    try {
      await navigator.clipboard.writeText(crewBrief(race))
      setCopied(true)
      window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setTab("crew")
    }
  }

  if (loadError instanceof ApiError && loadError.status === 404) return <Navigate to="/" replace />

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
    <AppFrame className="pb-28">
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
          <Hero race={race} onPatch={patchRace} />
          {(saveError || actionError) && <ErrorText>{saveError ?? actionError}</ErrorText>}
          <TabBar tabs={TABS} value={tab} onChange={setTab} />
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
            {tab === "plan" && (
              <PlanTab
                race={race}
                library={library}
                newId={newId}
                adding={adding}
                onAddSegment={onAdd}
                run={run}
                guarded={guarded}
                actions={{
                  patchSegment, moveSegment, moveItem, addItem, deleteItem, deleteSegment,
                  patchAidStation, addAidStation, deleteAidStation, moveAidStation,
                  addStationItem, deleteStationItem, moveStationItem,
                  addReminderItem, deleteReminderItem, moveReminderItem,
                }}
              />
            )}
            {tab === "audit" && <AuditTab race={race} />}
            {tab === "crew" && <CrewTab race={race} />}
            {tab === "pack" && <PackTab race={race} />}
          </div>
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
      {race && (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-background/92 px-[18px] pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur">
          <div className="mx-auto flex max-w-[484px] gap-2">
            <Link to={`/races/${id}/live`} className={cn(buttonVariants({ variant: "default", block: true }), "flex-1")}>
              <span aria-hidden className="size-2 rounded-full bg-green" />
              Start live tracking
            </Link>
            <Button
              variant="icon"
              size="icon"
              className="size-[54px] flex-none bg-card shadow-card"
              aria-label={copied ? "Crew brief copied" : "Copy crew brief"}
              onClick={copyBrief}
            >
              <Share aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </AppFrame>
  )
}
