import { useCallback, useEffect, useMemo, useState } from "react"

import { useAuth } from "@/auth/AuthContext"
import { racesApi, type Race } from "@/lib/racesApi"

export function useRaces() {
  const { authFetch } = useAuth()
  const api = useMemo(() => racesApi(authFetch), [authFetch])
  const [races, setRaces] = useState<Race[]>()
  const [error, setError] = useState<string>()

  const load = useCallback(
    () =>
      api
        .listRaces()
        .then((r) => {
          setRaces(r)
          setError(undefined)
        })
        .catch((e: Error) => setError(e.message)),
    [api],
  )

  useEffect(() => {
    load()
  }, [load])

  return { races, error, reload: load, createRace: api.createRace }
}
