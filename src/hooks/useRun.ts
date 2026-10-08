import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useAuth } from "@/auth/AuthContext"
import { ApiError } from "@/lib/api"
import { racesApi, type RunState } from "@/lib/racesApi"

export const POLL_MS = 20_000

const messageOf = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong")

/** Live run state: polls while the tab is visible, refreshes on focus, stops polling once the run is finished. */
export function useRun(raceId: string, onWake?: () => void) {
  const { authFetch } = useAuth()
  const api = useMemo(() => racesApi(authFetch), [authFetch])
  const [state, setState] = useState<RunState>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [gone, setGone] = useState(false)
  const latest = useRef(0)
  const wake = useRef(onWake)

  useEffect(() => {
    wake.current = onWake
  }, [onWake])

  const refresh = useCallback(async () => {
    const mine = ++latest.current
    try {
      const next = await api.getRun(raceId)
      if (mine !== latest.current) return
      setState(next)
      setError(undefined)
    } catch (e) {
      if (mine !== latest.current) return
      if (e instanceof ApiError && e.status === 404) setGone(true)
      else setError(messageOf(e))
    }
  }, [api, raceId])

  const finished = Boolean(state?.run?.finishedAtUtc)

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (finished) return
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh()
    }, POLL_MS)
    return () => window.clearInterval(id)
  }, [finished, refresh])

  useEffect(() => {
    const wakeUp = () => {
      if (document.visibilityState !== "visible") return
      refresh()
      wake.current?.()
    }
    document.addEventListener("visibilitychange", wakeUp)
    window.addEventListener("focus", wakeUp)
    return () => {
      document.removeEventListener("visibilitychange", wakeUp)
      window.removeEventListener("focus", wakeUp)
    }
  }, [refresh])

  const act = useCallback(
    async (fn: () => Promise<RunState>, conflictIsSuccess = false) => {
      setBusy(true)
      setError(undefined)
      const mine = ++latest.current
      try {
        const next = await fn()
        if (mine === latest.current) setState(next)
        else await refresh()
        return true
      } catch (e) {
        if (conflictIsSuccess && e instanceof ApiError && e.status === 409) {
          await refresh()
          return true
        }
        setError(messageOf(e))
        return false
      } finally {
        setBusy(false)
      }
    },
    [refresh],
  )

  return {
    state,
    error,
    busy,
    gone,
    start: (startedAt?: string) => act(() => api.startRun(raceId, startedAt), true),
    record: (checkpoint: string, arrivedAt?: string) => act(() => api.recordArrival(raceId, checkpoint, arrivedAt), true),
    editStart: (startedAt: string) => act(() => api.editRun(raceId, startedAt)),
    editArrival: (checkpoint: string, arrivedAt: string) => act(() => api.editArrival(raceId, checkpoint, arrivedAt)),
    undoArrival: (checkpoint: string) => act(() => api.deleteArrival(raceId, checkpoint)),
    undoStart: () => act(() => api.deleteRun(raceId)),
  }
}
