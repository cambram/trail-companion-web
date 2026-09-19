import { cn } from "@/lib/utils"

export function ErrorText({ className, ...props }: React.ComponentProps<"p">) {
  return <p role="alert" className={cn("text-sm text-destructive", className)} {...props} />
}
