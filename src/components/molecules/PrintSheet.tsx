type Props = { raceName: string; kicker: string; timeRange?: string; title: string; children: React.ReactNode }

/** One A4 page of the printable plan: header line, title, body. Breaks to a new page after itself when printed. */
export function PrintSheet({ raceName, kicker, timeRange, title, children }: Props) {
  return (
    <section className="print-sheet mx-auto mb-6 w-full max-w-[794px] bg-card p-8 shadow-card print:mb-0 print:max-w-none print:p-0 print:shadow-none">
      <header className="flex items-baseline justify-between gap-4 border-b border-border pb-2 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
        <span>
          {raceName || "Race"} · {kicker}
        </span>
        {timeRange && <span className="tabular-nums">{timeRange}</span>}
      </header>
      <h2 className="mt-4 mb-4 text-2xl font-extrabold tracking-tight">{title}</h2>
      {children}
    </section>
  )
}
