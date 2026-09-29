import { Plus } from "lucide-react"
import { Popover } from "radix-ui"
import { useRef, useState } from "react"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { sizeText } from "@/lib/planMath"
import type { NutritionItem } from "@/lib/racesApi"

type Props = {
  library: NutritionItem[] | undefined
  onPick: (nutritionItemId: string) => Promise<void>
}

export function AddNutrition({ library, onPick }: Props) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)

  if (library === undefined) return null

  if (library.length === 0) {
    return (
      <div className="mt-3 grid gap-2">
        <p className="text-[0.8125rem] text-muted-foreground">Your nutrition library is empty.</p>
        <Button variant="secondary" size="sm" className="justify-self-start" asChild>
          <Link to="/nutrition">Add nutrition</Link>
        </Button>
      </div>
    )
  }

  const needle = q.trim().toLowerCase()
  const filtered = library.filter((n) => n.name.toLowerCase().includes(needle))

  return (
    <div className="mt-3">
      <Popover.Root
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) setQ("")
        }}
      >
        <Popover.Trigger asChild>
          <Button variant="iconDark" size="iconLg" aria-label="Add nutrition">
            <Plus aria-hidden />
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={8}
            collisionPadding={12}
            onOpenAutoFocus={(e) => {
              e.preventDefault()
              searchRef.current?.focus({ preventScroll: true })
            }}
            className="z-50 w-[min(320px,calc(100vw-36px))] rounded-xl bg-card p-2 shadow-card"
          >
            <Input
              ref={searchRef}
              aria-label="Search your nutrition"
              placeholder="Search your nutrition"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <ul className="mt-2 max-h-64 overflow-y-auto">
              {filtered.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-secondary"
                    onClick={async () => {
                      setOpen(false)
                      setQ("")
                      await onPick(n.id).catch(() => {})
                    }}
                  >
                    <span className="min-w-0 truncate text-[0.95rem] font-semibold">{n.name}</span>
                    <span className="flex-none text-[0.8125rem] whitespace-nowrap text-muted-foreground">
                      {[n.carbs === null ? "" : `${n.carbs} g`, sizeText(n)].filter(Boolean).join(" · ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {filtered.length === 0 && <p className="px-3 py-2 text-[0.8125rem] text-muted-foreground">No match</p>}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
