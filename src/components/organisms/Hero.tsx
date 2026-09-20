import { Plus } from "lucide-react"

import { StatRail } from "@/components/molecules/StatRail"
import { Button } from "@/components/ui/button"
import type { RacePatch } from "@/hooks/useRace"
import { fmtDur, onTarget, raceTotals } from "@/lib/planMath"
import type { RaceDetail } from "@/lib/racesApi"

type Props = {
  race: RaceDetail
  onPatch: (patch: RacePatch) => void
  onAddSegment: () => void
  adding: boolean
}

export function Hero({ race, onPatch, onAddSegment, adding }: Props) {
  const t = raceTotals(race)
  const n = race.segments.length
  return (
    <div className="rounded-[26px] bg-primary p-[18px] text-primary-foreground">
      <div className="flex items-center justify-between gap-3">
        <input
          aria-label="Race name"
          aria-invalid={!race.name.trim()}
          maxLength={200}
          placeholder="Race name"
          className="min-h-9 min-w-0 flex-1 rounded-none bg-transparent text-[1.35rem] font-extrabold tracking-[-0.03em] outline-none placeholder:text-primary-foreground/45"
          value={race.name}
          onChange={(e) => onPatch({ name: e.target.value })}
        />
        <span className="flex flex-none items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1">
          <input
            aria-label="Carb target per hour"
            type="number"
            inputMode="numeric"
            min={0}
            className="w-11 bg-transparent text-right font-bold outline-none"
            value={race.target}
            onChange={(e) => onPatch({ target: Math.max(0, Math.floor(Number(e.target.value)) || 0) })}
          />
          <span className="text-[0.8125rem] font-semibold opacity-70">g/h</span>
        </span>
      </div>
      <div className="mt-3.5 text-[0.8125rem] font-semibold opacity-60">Carbs planned</div>
      <div className="mt-0.5 text-[2.1rem] leading-[1.1] font-extrabold tracking-[-0.03em]">
        {t.planned} g <span className="text-base font-semibold opacity-60">of {t.need} g needed</span>
      </div>
      <div className="mt-1 text-[0.8125rem] font-semibold opacity-60">
        Fluid planned <span className="font-extrabold opacity-100">{t.fluid} ml</span>
      </div>
      <div className="mt-3.5">
        <StatRail planned={t.planned} need={t.need} inverse>
          <span className="opacity-65">
            {n} segment{n === 1 ? "" : "s"}
          </span>
          <span className="opacity-90">
            {t.need ? (onTarget(t.planned, t.need) ? "On target" : `${t.need - t.planned} g short`) : ""}
          </span>
        </StatRail>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Distance">{t.distance ? `${t.distance.toFixed(1)} km` : "–"}</Stat>
        <Stat label="Time">{t.duration ? fmtDur(t.duration) : "–"}</Stat>
        <Stat label="Start">
          <input
            aria-label="Race start time"
            type="time"
            className="w-full bg-transparent font-extrabold outline-none [color-scheme:inherit]"
            value={race.startTime?.slice(0, 5) ?? ""}
            onChange={(e) => onPatch({ startTime: e.target.value ? `${e.target.value}:00` : null })}
          />
        </Stat>
      </div>
      <Button variant="onHero" block className="mt-4" onClick={onAddSegment} disabled={adding}>
        <Plus aria-hidden />
        Add segment
      </Button>
    </div>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-[14px] bg-primary-foreground/10 px-3 py-2">
      <div className="text-xs font-semibold opacity-60">{label}</div>
      <div className="text-[1.05rem] font-extrabold tracking-[-0.02em] whitespace-nowrap">{children}</div>
    </div>
  )
}
