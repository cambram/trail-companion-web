import { Printer } from "lucide-react"
import { useEffect } from "react"
import { Link, Navigate, useParams } from "react-router"

import { ErrorText } from "@/components/atoms/ErrorText"
import { PrintAudit } from "@/components/organisms/PrintAudit"
import { PrintBalance } from "@/components/organisms/PrintBalance"
import { PrintCover } from "@/components/organisms/PrintCover"
import { PrintPrep } from "@/components/organisms/PrintPrep"
import { PrintSegment } from "@/components/organisms/PrintSegment"
import { PrintStation } from "@/components/organisms/PrintStation"
import { Button, buttonVariants } from "@/components/ui/button"
import { useRace } from "@/hooks/useRace"
import { ApiError } from "@/lib/api"
import { auditTrail } from "@/lib/planInsights"
import { sheetOrder } from "@/lib/printPlan"

export default function PrintPage() {
  const { id = "" } = useParams()
  const { race, loadError } = useRace(id)

  useEffect(() => {
    const root = document.documentElement
    const previous = root.dataset.theme
    root.dataset.theme = "light"
    return () => {
      if (previous === undefined) delete root.dataset.theme
      else root.dataset.theme = previous
    }
  }, [])

  if (loadError instanceof ApiError && loadError.status === 404) return <Navigate to="/" replace />
  const events = race && race.segments.length > 0 ? auditTrail(race) : []

  return (
    <div className="min-h-screen bg-background px-4 py-4 print:min-h-0 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[794px] items-center justify-between gap-3 print:hidden">
        <Link to={`/races/${id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
          Back to plan
        </Link>
        <p className="hidden text-xs text-muted-foreground sm:block">Choose Save as PDF and turn off Headers and footers.</p>
        <Button size="sm" disabled={!race} onClick={() => window.print()}>
          <Printer aria-hidden />
          Save as PDF
        </Button>
      </div>
      {loadError && !race && <ErrorText>{loadError.message}</ErrorText>}
      {!race && !loadError && <p className="text-center text-sm text-muted-foreground">Loading...</p>}
      {race &&
        sheetOrder(race).map((sheet, n) => {
          if (sheet.kind === "cover") return <PrintCover key={n} race={race} />
          if (sheet.kind === "prep") return <PrintPrep key={n} race={race} />
          if (sheet.kind === "segment") return <PrintSegment key={n} race={race} index={sheet.index} events={events} />
          if (sheet.kind === "station")
            return <PrintStation key={n} race={race} segmentIndex={sheet.segmentIndex} stopNumber={sheet.stopNumber} stopCount={sheet.stopCount} events={events} />
          if (sheet.kind === "audit") return <PrintAudit key={n} race={race} events={events} />
          return <PrintBalance key={n} race={race} />
        })}
    </div>
  )
}
