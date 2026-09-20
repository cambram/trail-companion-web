import { useCallback, useEffect, useMemo, useState } from "react"

import { useAuth } from "@/auth/AuthContext"
import { racesApi, type NutritionItem, type NutritionItemRequest } from "@/lib/racesApi"

const byName = (a: NutritionItem, b: NutritionItem) => a.name.localeCompare(b.name)

export function useNutrition() {
  const { authFetch } = useAuth()
  const api = useMemo(() => racesApi(authFetch), [authFetch])
  const [items, setItems] = useState<NutritionItem[]>()
  const [error, setError] = useState<string>()

  const load = useCallback(
    () =>
      api
        .listNutrition()
        .then((n) => {
          setItems(n)
          setError(undefined)
        })
        .catch((e: Error) => setError(e.message)),
    [api],
  )

  useEffect(() => {
    load()
  }, [load])

  const create = useCallback(
    async (body: NutritionItemRequest) => {
      const created = await api.createNutrition(body)
      setItems((c) => [...(c ?? []), created].sort(byName))
    },
    [api],
  )

  const update = useCallback(
    async (id: string, body: NutritionItemRequest) => {
      const updated = await api.updateNutrition(id, body)
      setItems((c) => c?.map((n) => (n.id === id ? updated : n)).sort(byName))
    },
    [api],
  )

  const remove = useCallback(
    async (id: string) => {
      await api.deleteNutrition(id)
      setItems((c) => c?.filter((n) => n.id !== id))
    },
    [api],
  )

  return { items, error, reload: load, create, update, remove }
}
