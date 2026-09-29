import * as React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LayeredButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  href?: string;
  onClick?: () => void;
  className?: string;
  "aria-label"?: string;
}

const LayeredButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  LayeredButtonProps
>(({ children, variant = "primary", href, onClick, className, "aria-label": ariaLabel }, ref) => {
  const baseStyles = cn(
    "relative inline-flex items-center justify-center",
    "border-[0.6px] border-border rounded-[9999px]",
    "px-[29px] py-[11px]",
    "text-[14px] font-medium transition-all duration-200",
    "hover:scale-[1.02] active:scale-[0.98]",
    "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0",
    "before:h-[1px] before:bg-foreground/20 before:blur-[2px] before:opacity-60",
    "before:rounded-t-[9999px] before:transition-opacity before:duration-200",
    "hover:before:opacity-100",
    variant === "primary"
      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-primary/50"
      : "bg-background text-foreground border-border hover:bg-muted shadow-sm",
    className
  );

  const commonProps = {
    className: baseStyles,
    "aria-label": ariaLabel,
  };

  if (href) {
    return (
      <Link
        to={href}
        {...commonProps}
        ref={ref as React.Ref<HTMLAnchorElement>}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      {...commonProps}
      ref={ref as React.Ref<HTMLButtonElement>}
    >
      {children}
    </button>
  );
});

LayeredButton.displayName = "LayeredButton";

export { LayeredButton };
export type { LayeredButtonProps };
export default LayeredButton;
