import { ChevronLeft } from "lucide-react"
import { Link } from "react-router"

import { AppFrame } from "@/components/atoms/AppFrame"
import { ErrorText } from "@/components/atoms/ErrorText"
import { NutritionCard } from "@/components/organisms/NutritionCard"
import { NutritionForm } from "@/components/organisms/NutritionForm"
import { Card } from "@/components/ui/card"
import { useNutrition } from "@/hooks/useNutrition"

export default function NutritionPage() {
  const { items, error, create, update, remove } = useNutrition()

  return (
    <AppFrame>
      <header className="flex items-center gap-3 pt-3 pb-[18px]">
        <Link
          to="/"
          aria-label="Back to races"
          className="grid size-[42px] flex-none place-items-center rounded-full bg-card shadow-card"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <div className="flex-1 text-center font-extrabold">Nutrition</div>
        <span className="size-[42px]" />
      </header>
      <div className="grid gap-3">
        {error && <ErrorText>{error}</ErrorText>}
        {items === undefined && !error && <p className="text-[0.8125rem] text-muted-foreground">Loading...</p>}
        {items?.length === 0 && (
          <Card className="items-center py-[26px] text-center">
            <b>No nutrition yet</b>
            <p className="text-[0.8125rem] text-muted-foreground">
              Add the gels, drinks and bars you use, then pick them in any race segment.
            </p>
          </Card>
        )}
        {items?.map((n) => (
          <NutritionCard
            key={n.id}
            item={n}
            onSave={(body) => update(n.id, body)}
            onDelete={() => remove(n.id)}
          />
        ))}
        <NutritionForm onSubmit={create} />
      </div>
    </AppFrame>
  )
}
