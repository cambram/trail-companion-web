import type { AuthState } from "@/auth/AuthContext"

export type RaceRole = "Owner" | "Crew"

export type Race = {
  id: string
  name: string
  target: number
  startTime: string | null
  raceDate: string | null
  createdAtUtc: string
  role: RaceRole
}

export type RaceRequest = Pick<Race, "name" | "target" | "startTime" | "raceDate">

export type NutritionType = "Gel" | "Liquid" | "Solid" | "Pill"

export type NutritionItem = {
  id: string
  name: string
  type: NutritionType
  size: number | null
  carbs: number | null
  calories: number | null
  caffeine: number | null
  sodium: number | null
  potassium: number | null
  magnesium: number | null
  calcium: number | null
}

export type PlannedItem = NutritionItem & {
  nutritionItemId: string
  position: number
}

export type Item = PlannedItem & { segmentId: string }

export type AidStationItem = PlannedItem & { aidStationId: string }

export type KitCertainty = "Planned" | "Maybe"

export type KitEntry = { label: string; certainty: KitCertainty }

export type AidStation = {
  id: string
  name: string
  notes: string
  kit: KitEntry[]
  items: AidStationItem[]
}

export type Segment = {
  id: string
  position: number
  name: string
  duration: number
  endKm: number | null
  ascentM: number | null
  notes: string
  items: Item[]
  aidStation: AidStation | null
}

export type RaceDetail = Race & { segments: Segment[]; pin: string | null }

export type CrewMember = { appUserId: string; displayName: string; joinedAtUtc: string }

export type Arrival = { checkpoint: string; arrivedAtUtc: string }

export type Run = { id: string; startedAtUtc: string; finishedAtUtc: string | null; arrivals: Arrival[] }

export type RunState = { timeZone: string; today: string; canStart: boolean; run: Run | null }

export type SegmentRequest = { name: string; duration: number; endKm?: number | null; ascentM?: number | null; notes?: string }
export type NutritionItemRequest = Omit<NutritionItem, "id">
export type ItemRequest = { nutritionItemId: string }
export type AidStationRequest = { name: string; notes: string; kit: KitEntry[] }
type AidStationResponse = Omit<AidStation, "items"> & { segmentId: string }

type Fetch = AuthState["authFetch"]

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
})

export const racesApi = (f: Fetch) => ({
  listRaces: () => f<Race[]>("/api/races"),
  createRace: (body: RaceRequest) => f<Race>("/api/races", json("POST", body)),
  getRace: (id: string) => f<RaceDetail>(`/api/races/${id}`),
  updateRace: (id: string, body: RaceRequest) => f<Race>(`/api/races/${id}`, json("PUT", body)),
  deleteRace: (id: string) => f<void>(`/api/races/${id}`, json("DELETE")),
  joinRace: (pin: string) => f<Race>("/api/races/join", json("POST", { pin })),
  regeneratePin: (id: string) => f<{ pin: string }>(`/api/races/${id}/pin`, json("POST")),
  listCrew: (raceId: string) => f<CrewMember[]>(`/api/races/${raceId}/crew`),
  removeCrew: (raceId: string, appUserId: string) =>
    f<void>(`/api/races/${raceId}/crew/${appUserId}`, json("DELETE")),
  getRun: (raceId: string) => f<RunState>(`/api/races/${raceId}/run`),
  startRun: (raceId: string, startedAt?: string) =>
    f<RunState>(`/api/races/${raceId}/run/start`, json("POST", { startedAt })),
  editRun: (raceId: string, startedAt: string) => f<RunState>(`/api/races/${raceId}/run`, json("PATCH", { startedAt })),
  deleteRun: (raceId: string) => f<RunState>(`/api/races/${raceId}/run`, json("DELETE")),
  recordArrival: (raceId: string, checkpoint: string, arrivedAt?: string) =>
    f<RunState>(`/api/races/${raceId}/run/arrivals`, json("POST", { checkpoint, arrivedAt })),
  editArrival: (raceId: string, checkpoint: string, arrivedAt: string) =>
    f<RunState>(`/api/races/${raceId}/run/arrivals/${checkpoint}`, json("PATCH", { arrivedAt })),
  deleteArrival: (raceId: string, checkpoint: string) =>
    f<RunState>(`/api/races/${raceId}/run/arrivals/${checkpoint}`, json("DELETE")),

  createSegment: (raceId: string, body: SegmentRequest) =>
    f<Omit<Segment, "items" | "aidStation">>(`/api/races/${raceId}/segments`, json("POST", body)),
  updateSegment: (raceId: string, id: string, body: SegmentRequest) =>
    f<Omit<Segment, "items" | "aidStation">>(`/api/races/${raceId}/segments/${id}`, json("PUT", body)),
  deleteSegment: (raceId: string, id: string) =>
    f<void>(`/api/races/${raceId}/segments/${id}`, json("DELETE")),

  reorderSegments: (raceId: string, ids: string[]) =>
    f<void>(`/api/races/${raceId}/segments/order`, json("PUT", { ids })),
  reorderItems: (raceId: string, segmentId: string, ids: string[]) =>
    f<void>(`/api/races/${raceId}/segments/${segmentId}/items/order`, json("PUT", { ids })),

  listNutrition: () => f<NutritionItem[]>("/api/nutrition-items"),
  createNutrition: (body: NutritionItemRequest) => f<NutritionItem>("/api/nutrition-items", json("POST", body)),
  updateNutrition: (id: string, body: NutritionItemRequest) =>
    f<NutritionItem>(`/api/nutrition-items/${id}`, json("PUT", body)),
  deleteNutrition: (id: string) => f<void>(`/api/nutrition-items/${id}`, json("DELETE")),

  createItem: (raceId: string, segmentId: string, nutritionItemId: string) =>
    f<Item>(`/api/races/${raceId}/segments/${segmentId}/items`, json("POST", { nutritionItemId })),
  deleteItem: (raceId: string, segmentId: string, id: string) =>
    f<void>(`/api/races/${raceId}/segments/${segmentId}/items/${id}`, json("DELETE")),

  createAidStation: (raceId: string, body: { segmentId: string; name: string }) =>
    f<AidStationResponse>(`/api/races/${raceId}/aid-stations`, json("POST", body)),
  updateAidStation: (raceId: string, id: string, body: AidStationRequest) =>
    f<AidStationResponse>(`/api/races/${raceId}/aid-stations/${id}`, json("PUT", body)),
  deleteAidStation: (raceId: string, id: string) =>
    f<void>(`/api/races/${raceId}/aid-stations/${id}`, json("DELETE")),
  moveAidStation: (raceId: string, id: string, segmentId: string) =>
    f<void>(`/api/races/${raceId}/aid-stations/${id}/move`, json("PUT", { segmentId })),

  createStationItem: (raceId: string, aidStationId: string, nutritionItemId: string) =>
    f<AidStationItem>(`/api/races/${raceId}/aid-stations/${aidStationId}/items`, json("POST", { nutritionItemId })),
  deleteStationItem: (raceId: string, aidStationId: string, id: string) =>
    f<void>(`/api/races/${raceId}/aid-stations/${aidStationId}/items/${id}`, json("DELETE")),
  reorderStationItems: (raceId: string, aidStationId: string, ids: string[]) =>
    f<void>(`/api/races/${raceId}/aid-stations/${aidStationId}/items/order`, json("PUT", { ids })),
})
