import { Minus, Plus } from "lucide-react"
import { useState } from "react"

import { StatRail } from "@/components/molecules/StatRail"
import { AscentProfile } from "@/components/organisms/AscentProfile"
import type { RacePatch } from "@/hooks/useRace"
import {
  MAX_REMINDER_INTERVAL_MIN,
  MIN_REMINDER_INTERVAL_MIN,
  clockToMin,
  fmtClock,
  fmtDur,
  fmtPace,
  onTarget,
  raceTotals,
} from "@/lib/planMath"
import type { RaceDetail } from "@/lib/racesApi"

type Props = {
  race: RaceDetail
  onPatch: (patch: RacePatch) => void
}

const clampTarget = (n: number) => Math.min(300, Math.max(0, n))

export function Hero({ race, onPatch }: Props) {
  const t = raceTotals(race)
  const ascent = race.segments.reduce((a, s) => a + (s.ascentM ?? 0), 0)
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
        <span className="flex flex-none items-center gap-1.5">
          <button
            type="button"
            aria-label="Lower target"
            className="grid size-8 place-items-center rounded-full bg-primary-foreground/15"
            onClick={() => onPatch({ target: clampTarget(race.target - 5) })}
          >
            <Minus aria-hidden className="size-4" />
          </button>
          <input
            aria-label="Carb target per hour"
            type="number"
            inputMode="numeric"
            min={0}
            max={300}
            className="w-11 bg-transparent text-right font-bold outline-none"
            value={race.target}
            onChange={(e) => onPatch({ target: clampTarget(Math.floor(Number(e.target.value)) || 0) })}
          />
          <span className="text-[0.8125rem] font-semibold opacity-70">g/h</span>
          <button
            type="button"
            aria-label="Raise target"
            className="grid size-8 place-items-center rounded-full bg-primary-foreground/15"
            onClick={() => onPatch({ target: clampTarget(race.target + 5) })}
          >
            <Plus aria-hidden className="size-4" />
          </button>
        </span>
      </div>
      <div className="mt-3.5 text-[0.8125rem] font-semibold opacity-60">Carbs planned</div>
      <div className="mt-0.5 text-[1.75rem] leading-[1.1] sm:text-[2.1rem] font-extrabold tracking-[-0.03em]">
        {t.planned} g <span className="text-base font-semibold opacity-60">of {t.need} g needed</span>
      </div>
      <div className="mt-1 text-[0.8125rem] font-semibold opacity-60">
        Fluid planned <span className="font-extrabold opacity-100">{t.fluid} ml</span>
      </div>
      <ReminderInterval
        value={race.reminderIntervalMin}
        target={race.target}
        onChange={(min) => onPatch({ reminderIntervalMin: min })}
      />
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
      <div className="mt-4">
        <AscentProfile segments={race.segments} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Distance">{t.distance ? `${t.distance.toFixed(1)} km` : "–"}</Stat>
        <Stat label="Ascent">{ascent ? `${ascent.toLocaleString("en")} m` : "–"}</Stat>
        <Stat label="Time">{t.duration ? fmtDur(t.duration) : "–"}</Stat>
        <Stat label="Avg pace">{t.duration && t.distance ? `${fmtPace(t.duration / t.distance)} /km` : "–"}</Stat>
        <Stat label="Start">
          <input
            aria-label="Race start time"
            type="time"
            className="w-full min-w-0 bg-transparent font-extrabold outline-none [color-scheme:inherit]"
            value={race.startTime?.slice(0, 5) ?? ""}
            onChange={(e) => onPatch({ startTime: e.target.value ? `${e.target.value}:00` : null })}
          />
        </Stat>
        <Stat label="Finish ETA">{race.startTime && t.duration ? fmtClock(clockToMin(race.startTime) + t.duration) : "–"}</Stat>
        <div className="col-span-3">
          <Stat label="Date">
            <input
              aria-label="Race date"
              type="date"
              className="w-full min-w-0 bg-transparent font-extrabold outline-none [color-scheme:inherit]"
              value={race.raceDate ?? ""}
              onChange={(e) => onPatch({ raceDate: e.target.value || null })}
            />
          </Stat>
        </div>
      </div>
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

const validInterval = (text: string) => {
  const n = Number(text)
  return /^\d{1,3}$/.test(text.trim()) && n >= MIN_REMINDER_INTERVAL_MIN && n <= MAX_REMINDER_INTERVAL_MIN
}

function ReminderInterval({ value, target, onChange }: { value: number; target: number; onChange: (min: number) => void }) {
  const [text, setText] = useState(String(value))
  const valid = validInterval(text)
  const shown = valid ? Number(text) : value
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[0.8125rem] font-semibold">
      <span className="opacity-60">Reminder every</span>
      <input
        aria-label="Reminder interval in minutes"
        inputMode="numeric"
        aria-invalid={!valid}
        className="w-9 bg-transparent text-right font-extrabold outline-none"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          if (validInterval(e.target.value)) onChange(Number(e.target.value))
        }}
        onBlur={() => setText(String(value))}
      />
      <span className="opacity-60">min</span>
      {!valid && <span className="basis-full text-red-soft">Use 5 to 180 minutes.</span>}
      <span className="opacity-60">· {Math.round((target * shown) / 60)} g per reminder before flasks</span>
    </div>
  )
}
