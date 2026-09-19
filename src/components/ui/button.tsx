import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-[0.95rem] font-bold whitespace-nowrap transition-opacity outline-none hover:opacity-90 active:translate-y-px disabled:pointer-events-none disabled:opacity-35 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        // Inverse of default: for use on the black hero card.
        onHero: "bg-primary-foreground text-primary",
        // Low-priority text action, e.g. delete.
        quiet: "bg-transparent px-0 text-[0.8125rem] font-semibold text-muted-foreground hover:opacity-100",
        // Armed confirmation state of quiet.
        quietArmed: "bg-transparent px-0 text-[0.8125rem] font-semibold text-red",
        // Round icon-only buttons.
        icon: "bg-secondary text-ink-soft hover:opacity-100",
        iconDark: "bg-primary text-primary-foreground",
      },
      size: {
        default: "min-h-[50px] px-5",
        sm: "min-h-10 px-3.5 text-[0.8125rem]",
        icon: "size-9 p-0 [&_svg:not([class*='size-'])]:size-[18px]",
        iconLg: "size-[46px] p-0",
      },
      block: { true: "w-full", false: "" },
    },
    compoundVariants: [
      { variant: ["quiet", "quietArmed"], size: "default", className: "min-h-10 px-0" },
    ],
    defaultVariants: { variant: "default", size: "default", block: false },
  }
)

function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, block, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
