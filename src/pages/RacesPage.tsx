import { useNavigate } from "react-router"

import { useAuth } from "@/auth/AuthContext"
import { AppFrame } from "@/components/atoms/AppFrame"
import { ErrorText } from "@/components/atoms/ErrorText"
import { Heading } from "@/components/atoms/Heading"
import { Subtitle } from "@/components/atoms/Subtitle"
import { NewRaceForm } from "@/components/organisms/NewRaceForm"
import { RaceCard } from "@/components/organisms/RaceCard"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRaces } from "@/hooks/useRaces"

export default function RacesPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { races, error, reload, createRace } = useRaces()

  return (
    <AppFrame className="pt-3">
      <header className="flex items-center gap-3 pt-3 pb-[18px]">
        <div className="min-w-0 flex-1">
          <Heading>Races</Heading>
          <Subtitle>Plan each segment's fuel and pace</Subtitle>
        </div>
        <Button variant="quiet" onClick={logout}>
          Log out
        </Button>
      </header>
      <div className="grid gap-3">
        {error && (
          <Card>
            <ErrorText>{error}</ErrorText>
            <Button variant="secondary" size="sm" onClick={reload}>
              Retry
            </Button>
          </Card>
        )}
        {races?.length === 0 && (
          <Card className="items-center py-[26px] text-center">
            <b>No races yet</b>
            <p className="text-[0.8125rem] text-muted-foreground">Create a race, then split it into segments.</p>
          </Card>
        )}
        {races === undefined && !error && <p className="text-[0.8125rem] text-muted-foreground">Loading...</p>}
        {races?.map((r) => <RaceCard key={r.id} race={r} />)}
        <NewRaceForm onCreate={async (name, target, startTime) => navigate(`/races/${(await createRace(name, target, startTime)).id}`)} />
      </div>
    </AppFrame>
  )
}
