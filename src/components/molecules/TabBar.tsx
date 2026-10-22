import { cn } from "@/lib/utils"

type Props = { tabs: { id: string; label: string }[]; value: string; onChange: (id: string) => void }

/** Sticky pill switcher. The panels it controls carry `id="panel-{tab}"`. */
export function TabBar({ tabs, value, onChange }: Props) {
  return (
    <div className="sticky top-0 z-10 -mx-[18px] bg-background/92 px-[18px] py-2.5 backdrop-blur">
      <div role="tablist" aria-label="Plan views" className="grid grid-cols-4 rounded-full bg-card p-1 shadow-card">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={value === t.id}
            aria-controls={`panel-${t.id}`}
            className={cn(
              "min-h-9 rounded-full text-sm font-semibold",
              value === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
            onClick={() => onChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
