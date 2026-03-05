"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Mask } from "@/components/ui/mask";
import { cn } from "@/lib/utils";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  if (!open) return null;

  return (
    <Mask
      open={open}
      onOpenChange={onOpenChange}
      dismissible
      variant="blur"
      className="flex items-center justify-center p-4"
    >
      <div
        className={cn(
          "relative w-full max-w-2xl bg-black border border-white/10 rounded-lg shadow-xl",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </Mask>
  );
};

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
});
DialogContent.displayName = "DialogContent";

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-start justify-between mb-4", className)}
      {...props}
    />
  );
});
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold text-white", className)}
      {...props}
    />
  );
});
DialogTitle.displayName = "DialogTitle";

const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    onClose?: () => void;
  }
>(({ className, onClose, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClose}
      className={cn(
        "absolute right-4 top-4 rounded-full p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors",
        className
      )}
      {...props}
    >
      <X className="size-4" />
      <span className="sr-only">Close</span>
    </button>
  );
});
DialogClose.displayName = "DialogClose";

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose };




