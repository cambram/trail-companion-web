export type Tone = "green" | "red" | "amber" | "violet" | "muted"

export const TONE_CLASSES: Record<Tone, string> = {
  green: "bg-green-soft text-green",
  red: "bg-red-soft text-red",
  amber: "bg-amber-soft text-amber",
  violet: "bg-violet-soft text-violet",
  muted: "bg-secondary text-muted-foreground",
}
