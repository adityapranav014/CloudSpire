import { cn } from "@/utils/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md",
        "bg-[var(--bg-elevated)] before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-[rgba(255,255,255,0.06)] before:to-transparent",
        "before:animate-[shimmer_1.6s_ease-in-out_infinite] before:-translate-x-full",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
