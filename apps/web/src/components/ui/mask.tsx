"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MaskProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether the mask is visible
   */
  open?: boolean;
  /**
   * Callback when mask is clicked (for backdrop dismissal)
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Whether clicking the backdrop should close the mask
   */
  dismissible?: boolean;
  /**
   * Mask variant style
   */
  variant?: "default" | "subtle" | "blur";
  /**
   * Content to display on top of the mask
   */
  children?: React.ReactNode;
}

const Mask = React.forwardRef<HTMLDivElement, MaskProps>(
  (
    {
      open = true,
      onOpenChange,
      dismissible = false,
      variant = "default",
      children,
      className,
      ...props
    },
    ref
  ) => {
    if (!open) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (dismissible && e.target === e.currentTarget) {
        onOpenChange?.(false);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "fixed inset-0 z-50",
          variant === "blur" && "backdrop-blur-sm",
          variant === "subtle" && "bg-black/20",
          variant === "default" && "bg-black/40",
          "transition-opacity duration-200",
          className
        )}
        onClick={handleBackdropClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Mask.displayName = "Mask";

export { Mask };

