import { ChevronRight, Flag } from "lucide-react"
import { Link } from "react-router"

import { Card } from "@/components/ui/card"
import type { Race } from "@/lib/racesApi"

export function RaceCard({ race }: { race: Race }) {
  return (
    <Link to={`/races/${race.id}`} className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card className="flex-row items-center gap-3">
        <span className="grid size-10 flex-none place-items-center rounded-full bg-secondary">
          <Flag className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <b className="block truncate text-[1.05rem] tracking-[-0.02em]">{race.name}</b>
          <span className="text-[0.8125rem] text-muted-foreground">
            {race.target} g/h · {race.raceDate ? new Date(`${race.raceDate}T00:00`).toLocaleDateString() : "No date"}
          </span>
        </span>
        <span className="grid size-9 flex-none place-items-center rounded-full bg-secondary text-ink-soft">
          <ChevronRight className="size-[18px]" aria-hidden />
        </span>
      </Card>
    </Link>
  )
}
