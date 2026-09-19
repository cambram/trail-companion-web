import { cn } from "@/lib/utils"

export function Subtitle({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("mt-px text-[0.8125rem] text-muted-foreground", className)} {...props} />
}
