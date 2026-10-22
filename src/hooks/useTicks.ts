import { useState } from "react"

import { loadChecks, saveChecks } from "@/lib/checks"

/** Tick state backed by checks.ts, which swallows blocked storage. */
export function useTicks(scope: string) {
  const [ticks, setTicks] = useState(() => loadChecks(scope))
  const toggle = (id: string) => {
    const next = { ...ticks }
    if (next[id]) delete next[id]
    else next[id] = true
    setTicks(next)
    saveChecks(scope, next)
  }
  return { ticks, toggle }
}
