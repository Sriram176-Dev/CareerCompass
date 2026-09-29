import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgePillProps {
  label: string;
  date: string;
  className?: string;
}

const BadgePill = React.forwardRef<HTMLDivElement, BadgePillProps>(
  ({ label, date, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center",
          "rounded-[20px]",
          "bg-muted/50 dark:bg-white/10",
          "border border-border dark:border-white/20",
          "px-4 py-2",
          "text-[13px] font-medium transition-colors duration-300",
          className
        )}
      >
        <span className="w-1 h-1 rounded-full bg-primary mr-2" />
        <span className="text-muted-foreground dark:text-white/60">{label}</span>
        <span className="text-foreground dark:text-white ml-1 font-semibold">{date}</span>
      </div>
    );
  }
);

BadgePill.displayName = "BadgePill";

export { BadgePill };
export type { BadgePillProps };
export default BadgePill;
