import { cn } from "@/lib/utils"

export function StatusPill({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-[5px] text-xs font-bold whitespace-nowrap",
        ok ? "bg-green-soft text-green" : "bg-red-soft text-red",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}
