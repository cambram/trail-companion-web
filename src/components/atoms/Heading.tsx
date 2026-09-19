import { cn } from "@/lib/utils"

export function Heading({ className, ...props }: React.ComponentProps<"h1">) {
  return <h1 className={cn("text-2xl font-semibold", className)} {...props} />
}
