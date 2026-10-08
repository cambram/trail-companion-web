import { useCallback, useEffect, useMemo, useState } from "react"

import { useAuth } from "@/auth/AuthContext"
import { racesApi, type CrewMember } from "@/lib/racesApi"

export function useCrew(raceId: string) {
  const { authFetch } = useAuth()
  const api = useMemo(() => racesApi(authFetch), [authFetch])
  const [crew, setCrew] = useState<CrewMember[]>()
  const [error, setError] = useState<string>()

  const load = useCallback(
    () =>
      api
        .listCrew(raceId)
        .then((c) => {
          setCrew(c)
          setError(undefined)
        })
        .catch((e: Error) => setError(e.message)),
    [api, raceId],
  )

  useEffect(() => {
    load()
  }, [load])

  const remove = async (appUserId: string) => {
    await api.removeCrew(raceId, appUserId)
    setCrew((c) => c?.filter((m) => m.appUserId !== appUserId))
  }

  return { crew, error, remove }
}
