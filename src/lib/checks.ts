export type Ticks = Record<string, true>

const key = (runId: string) => `crewmate:checks:${runId}`

export const checkId = (stationId: string, group: string, index: number) => `${stationId}:${group}:${index}`

/** Anything that is not an object of `true` values reads as no ticks. */
export function parseChecks(raw: string | null): Ticks {
  try {
    const value: unknown = JSON.parse(raw ?? "{}")
    if (typeof value !== "object" || value === null || Array.isArray(value)) return {}
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v === true)) as Ticks
  } catch {
    return {}
  }
}

/** Ticks live on this device only. Private mode or blocked storage must never break the page. */
export function loadChecks(runId: string): Ticks {
  try {
    return parseChecks(localStorage.getItem(key(runId)))
  } catch {
    return {}
  }
}

export function saveChecks(runId: string, ticks: Ticks) {
  try {
    localStorage.setItem(key(runId), JSON.stringify(ticks))
  } catch {
    // storage full or blocked: ticks just do not persist
  }
}
