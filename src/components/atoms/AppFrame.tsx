import { cn } from "@/lib/utils"

/** The single 520px column every page lives in. */
export function AppFrame({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      className={cn("mx-auto w-full max-w-[520px] px-[18px] pt-2 pb-10", className)}
      {...props}
    />
  )
}
