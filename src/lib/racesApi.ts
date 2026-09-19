import type { AuthState } from "@/auth/AuthContext"

export type Race = { id: string; name: string; target: number; startTime: string | null; createdAtUtc: string }

export type Item = { id: string; segmentId: string; position: number; name: string; carbs: number }

export type Segment = {
  id: string
  position: number
  name: string
  duration: number
  distance: number | null
  notes: string
  items: Item[]
}

export type RaceDetail = Race & { segments: Segment[] }

export type SegmentRequest = { name: string; duration: number; distance?: number | null; notes?: string }
export type ItemRequest = { name: string; carbs: number }

type Fetch = AuthState["authFetch"]

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
})

export const racesApi = (f: Fetch) => ({
  listRaces: () => f<Race[]>("/api/races"),
  createRace: (name: string, target: number, startTime: string | null) =>
    f<Race>("/api/races", json("POST", { name, target, startTime })),
  getRace: (id: string) => f<RaceDetail>(`/api/races/${id}`),
  updateRace: (id: string, name: string, target: number, startTime: string | null) =>
    f<Race>(`/api/races/${id}`, json("PUT", { name, target, startTime })),
  deleteRace: (id: string) => f<void>(`/api/races/${id}`, json("DELETE")),

  createSegment: (raceId: string, body: SegmentRequest) =>
    f<Omit<Segment, "items">>(`/api/races/${raceId}/segments`, json("POST", body)),
  updateSegment: (raceId: string, id: string, body: SegmentRequest) =>
    f<Omit<Segment, "items">>(`/api/races/${raceId}/segments/${id}`, json("PUT", body)),
  deleteSegment: (raceId: string, id: string) =>
    f<void>(`/api/races/${raceId}/segments/${id}`, json("DELETE")),

  reorderSegments: (raceId: string, ids: string[]) =>
    f<void>(`/api/races/${raceId}/segments/order`, json("PUT", { ids })),
  reorderItems: (raceId: string, segmentId: string, ids: string[]) =>
    f<void>(`/api/races/${raceId}/segments/${segmentId}/items/order`, json("PUT", { ids })),

  createItem: (raceId: string, segmentId: string, body: ItemRequest) =>
    f<Item>(`/api/races/${raceId}/segments/${segmentId}/items`, json("POST", body)),
  updateItem: (raceId: string, segmentId: string, id: string, body: ItemRequest) =>
    f<Item>(`/api/races/${raceId}/segments/${segmentId}/items/${id}`, json("PUT", body)),
  deleteItem: (raceId: string, segmentId: string, id: string) =>
    f<void>(`/api/races/${raceId}/segments/${segmentId}/items/${id}`, json("DELETE")),
})
