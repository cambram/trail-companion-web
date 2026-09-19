import { cn } from "@/lib/utils"

export function Heading({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      className={cn("text-[1.55rem] leading-[1.15] font-extrabold tracking-[-0.03em]", className)}
      {...props}
    />
  )
}
