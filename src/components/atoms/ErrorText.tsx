import { cn } from "@/lib/utils"

export function ErrorText({ className, ...props }: React.ComponentProps<"p">) {
  return <p role="alert" className={cn("text-[0.8125rem] font-semibold text-red", className)} {...props} />
}
