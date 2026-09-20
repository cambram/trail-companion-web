import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useAuth } from "@/auth/AuthContext"
import type { ApiError } from "@/lib/api"
import { racesApi, type RaceDetail, type Segment } from "@/lib/racesApi"

const SAVE_DELAY_MS = 500
const RACE_KEY = "race"

function move<T>(arr: T[], i: number, d: number) {
  const j = i + d
  if (j < 0 || j >= arr.length) return arr
  const copy = [...arr]
  ;[copy[i], copy[j]] = [copy[j], copy[i]]
  return copy
}

export type RacePatch = Partial<Pick<RaceDetail, "name" | "target" | "startTime">>
export type SegmentPatch = Partial<Pick<Segment, "name" | "duration" | "distance" | "notes">>

export function useRace(id: string) {
  const { authFetch } = useAuth()
  const api = useMemo(() => racesApi(authFetch), [authFetch])
  const [race, setRace] = useState<RaceDetail>()
  const [loadError, setLoadError] = useState<ApiError | Error>()
  const [saveError, setSaveError] = useState<string>()
  const raceRef = useRef<RaceDetail>(undefined)
  const timers = useRef(new Map<string, number>())

  useEffect(() => {
    raceRef.current = race
  }, [race])

  const load = useCallback(
    () =>
      api
        .getRace(id)
        .then((r) =>
          setRace({
            ...r,
            segments: [...r.segments]
              .sort((a, b) => a.position - b.position)
              .map((s) => ({ ...s, items: [...s.items].sort((a, b) => a.position - b.position) })),
          }),
        )
        .catch(setLoadError),
    [api, id],
  )

  useEffect(() => {
    load()
  }, [load])

  const saveSegment = useCallback(
    (segId: string) => {
      timers.current.delete(segId)
      const s = raceRef.current?.segments.find((x) => x.id === segId)
      if (!s || !s.name.trim()) return
      api
        .updateSegment(id, segId, { name: s.name.trim(), duration: s.duration, distance: s.distance, notes: s.notes })
        .then(() => setSaveError(undefined))
        .catch((e: Error) => setSaveError(e.message))
    },
    [api, id],
  )

  const saveRace = useCallback(() => {
    timers.current.delete(RACE_KEY)
    const r = raceRef.current
    if (!r || !r.name.trim()) return
    api
      .updateRace(id, r.name.trim(), r.target, r.startTime)
      .then(() => setSaveError(undefined))
      .catch((e: Error) => setSaveError(e.message))
  }, [api, id])

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((t, key) => {
        clearTimeout(t)
        if (key === RACE_KEY) saveRace()
        else saveSegment(key)
      })
    }
  }, [saveSegment, saveRace])

  const patchRace = useCallback(
    (patch: RacePatch) => {
      setRace((r) => r && { ...r, ...patch })
      clearTimeout(timers.current.get(RACE_KEY))
      timers.current.set(RACE_KEY, window.setTimeout(saveRace, SAVE_DELAY_MS))
    },
    [saveRace],
  )

  const patchSegment = useCallback(
    (segId: string, patch: SegmentPatch) => {
      setRace((r) => r && { ...r, segments: r.segments.map((s) => (s.id === segId ? { ...s, ...patch } : s)) })
      clearTimeout(timers.current.get(segId))
      timers.current.set(segId, window.setTimeout(() => saveSegment(segId), SAVE_DELAY_MS))
    },
    [saveSegment],
  )

  const addSegment = useCallback(async () => {
    const n = (raceRef.current?.segments.length ?? 0) + 1
    const created = await api.createSegment(id, { name: `Segment ${n}`, duration: 0 })
    setRace((r) => r && { ...r, segments: [...r.segments, { ...created, items: [] }] })
    return created.id
  }, [api, id])

  const deleteSegment = useCallback(
    async (segId: string) => {
      clearTimeout(timers.current.get(segId))
      timers.current.delete(segId)
      await api.deleteSegment(id, segId)
      setRace((r) => r && { ...r, segments: r.segments.filter((s) => s.id !== segId) })
    },
    [api, id],
  )

  const addItem = useCallback(
    async (segId: string, nutritionItemId: string) => {
      const item = await api.createItem(id, segId, nutritionItemId)
      setRace(
        (r) =>
          r && {
            ...r,
            segments: r.segments.map((s) => (s.id === segId ? { ...s, items: [...s.items, item] } : s)),
          },
      )
    },
    [api, id],
  )

  const deleteItem = useCallback(
    async (segId: string, itemId: string) => {
      await api.deleteItem(id, segId, itemId)
      setRace(
        (r) =>
          r && {
            ...r,
            segments: r.segments.map((s) =>
              s.id === segId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s,
            ),
          },
      )
    },
    [api, id],
  )

  const moveSegment = useCallback(
    async (segId: string, d: number) => {
      const current = raceRef.current
      if (!current) return
      const segments = move(current.segments, current.segments.findIndex((s) => s.id === segId), d)
      if (segments === current.segments) return
      setRace({ ...current, segments })
      try {
        await api.reorderSegments(id, segments.map((s) => s.id))
      } catch (e) {
        setSaveError((e as Error).message)
        load()
      }
    },
    [api, id, load],
  )

  const moveItem = useCallback(
    async (segId: string, itemId: string, d: number) => {
      const current = raceRef.current
      const seg = current?.segments.find((s) => s.id === segId)
      if (!current || !seg) return
      const items = move(seg.items, seg.items.findIndex((i) => i.id === itemId), d)
      if (items === seg.items) return
      setRace({ ...current, segments: current.segments.map((s) => (s.id === segId ? { ...s, items } : s)) })
      try {
        await api.reorderItems(id, segId, items.map((i) => i.id))
      } catch (e) {
        setSaveError((e as Error).message)
        load()
      }
    },
    [api, id, load],
  )

  const deleteRace = useCallback(() => api.deleteRace(id), [api, id])

  return { race, loadError, saveError, patchRace, moveSegment, moveItem, patchSegment, addSegment, deleteSegment, addItem, deleteItem, deleteRace }
}
