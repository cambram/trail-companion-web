import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useAuth } from "@/auth/AuthContext"
import type { ApiError } from "@/lib/api"
import { racesApi, type AidStation, type RaceDetail, type Segment } from "@/lib/racesApi"

const SAVE_DELAY_MS = 500
const RACE_KEY = "race"

function move<T>(arr: T[], i: number, d: number) {
  const j = i + d
  if (j < 0 || j >= arr.length) return arr
  const copy = [...arr]
  ;[copy[i], copy[j]] = [copy[j], copy[i]]
  return copy
}

export type RacePatch = Partial<Pick<RaceDetail, "name" | "target" | "startTime" | "raceDate">>
export type SegmentPatch = Partial<Pick<Segment, "name" | "duration" | "endKm" | "notes">>
export type AidStationPatch = Partial<Pick<AidStation, "name" | "notes" | "kit">>

const byPosition = <T extends { position: number }>(xs: T[]) => [...xs].sort((a, b) => a.position - b.position)

function withStation(r: RaceDetail, stationId: string, fn: (a: AidStation) => AidStation): RaceDetail {
  return {
    ...r,
    segments: r.segments.map((s) => (s.aidStation && s.aidStation.id === stationId ? { ...s, aidStation: fn(s.aidStation) } : s)),
  }
}

const stationOf = (r: RaceDetail | undefined, stationId: string) =>
  r?.segments.find((s) => s.aidStation?.id === stationId)?.aidStation ?? undefined

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
            segments: byPosition(r.segments).map((s) => ({
              ...s,
              items: byPosition(s.items),
              aidStation: s.aidStation && { ...s.aidStation, items: byPosition(s.aidStation.items) },
            })),
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
        .updateSegment(id, segId, { name: s.name.trim(), duration: s.duration, endKm: s.endKm, notes: s.notes })
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
      .updateRace(id, { name: r.name.trim(), target: r.target, startTime: r.startTime, raceDate: r.raceDate })
      .then(() => setSaveError(undefined))
      .catch((e: Error) => setSaveError(e.message))
  }, [api, id])

  const saveAidStation = useCallback(
    (stationId: string) => {
      timers.current.delete(stationId)
      const a = stationOf(raceRef.current, stationId)
      if (!a || !a.name.trim()) return
      api
        .updateAidStation(id, stationId, { name: a.name.trim(), notes: a.notes, kit: a.kit })
        .then(() => setSaveError(undefined))
        .catch((e: Error) => setSaveError(e.message))
    },
    [api, id],
  )

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((t, key) => {
        clearTimeout(t)
        if (key === RACE_KEY) saveRace()
        else {
          saveSegment(key)
          saveAidStation(key)
        }
      })
    }
  }, [saveSegment, saveRace, saveAidStation])

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

  const patchAidStation = useCallback(
    (stationId: string, patch: AidStationPatch) => {
      setRace((r) => r && withStation(r, stationId, (a) => ({ ...a, ...patch })))
      clearTimeout(timers.current.get(stationId))
      timers.current.set(stationId, window.setTimeout(() => saveAidStation(stationId), SAVE_DELAY_MS))
    },
    [saveAidStation],
  )

  const addSegment = useCallback(async () => {
    const n = (raceRef.current?.segments.length ?? 0) + 1
    const created = await api.createSegment(id, { name: `Segment ${n}`, duration: 0 })
    setRace((r) => r && { ...r, segments: [...r.segments, { ...created, items: [], aidStation: null }] })
    return created.id
  }, [api, id])

  const deleteSegment = useCallback(
    async (segId: string) => {
      clearTimeout(timers.current.get(segId))
      timers.current.delete(segId)
      const stationId = raceRef.current?.segments.find((s) => s.id === segId)?.aidStation?.id
      if (stationId) {
        clearTimeout(timers.current.get(stationId))
        timers.current.delete(stationId)
      }
      await api.deleteSegment(id, segId)
      setRace((r) => r && { ...r, segments: r.segments.filter((s) => s.id !== segId) })
    },
    [api, id],
  )

  const addAidStation = useCallback(
    async (segId: string) => {
      const { segmentId: _, ...created } = await api.createAidStation(id, { segmentId: segId, name: "Aid station" })
      setRace((r) => r && { ...r, segments: r.segments.map((s) => (s.id === segId ? { ...s, aidStation: { ...created, items: [] } } : s)) })
    },
    [api, id],
  )

  const deleteAidStation = useCallback(
    async (stationId: string) => {
      clearTimeout(timers.current.get(stationId))
      timers.current.delete(stationId)
      await api.deleteAidStation(id, stationId)
      setRace((r) => r && { ...r, segments: r.segments.map((s) => (s.aidStation?.id === stationId ? { ...s, aidStation: null } : s)) })
    },
    [api, id],
  )

  const moveAidStation = useCallback(
    async (stationId: string, d: number) => {
      const current = raceRef.current
      if (!current) return
      const i = current.segments.findIndex((s) => s.aidStation?.id === stationId)
      const j = i + d
      if (i < 0 || j < 0 || j >= current.segments.length) return
      const from = current.segments[i]
      const to = current.segments[j]
      setRace({
        ...current,
        segments: current.segments.map((s, k) =>
          k === i ? { ...s, aidStation: to.aidStation } : k === j ? { ...s, aidStation: from.aidStation } : s,
        ),
      })
      try {
        await api.moveAidStation(id, stationId, to.id)
      } catch (e) {
        setSaveError((e as Error).message)
        load()
      }
    },
    [api, id, load],
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

  const addStationItem = useCallback(
    async (stationId: string, nutritionItemId: string) => {
      const item = await api.createStationItem(id, stationId, nutritionItemId)
      setRace((r) => r && withStation(r, stationId, (a) => ({ ...a, items: [...a.items, item] })))
    },
    [api, id],
  )

  const deleteStationItem = useCallback(
    async (stationId: string, itemId: string) => {
      await api.deleteStationItem(id, stationId, itemId)
      setRace((r) => r && withStation(r, stationId, (a) => ({ ...a, items: a.items.filter((i) => i.id !== itemId) })))
    },
    [api, id],
  )

  const moveStationItem = useCallback(
    async (stationId: string, itemId: string, d: number) => {
      const current = raceRef.current
      const station = stationOf(current, stationId)
      if (!current || !station) return
      const items = move(station.items, station.items.findIndex((i) => i.id === itemId), d)
      if (items === station.items) return
      setRace(withStation(current, stationId, (a) => ({ ...a, items })))
      try {
        await api.reorderStationItems(id, stationId, items.map((i) => i.id))
      } catch (e) {
        setSaveError((e as Error).message)
        load()
      }
    },
    [api, id, load],
  )

  const deleteRace = useCallback(() => api.deleteRace(id), [api, id])

  return {
    race,
    loadError,
    reload: load,
    saveError,
    patchRace,
    moveSegment,
    moveItem,
    patchSegment,
    addSegment,
    deleteSegment,
    addItem,
    deleteItem,
    deleteRace,
    patchAidStation,
    addAidStation,
    deleteAidStation,
    moveAidStation,
    addStationItem,
    deleteStationItem,
    moveStationItem,
  }
}
