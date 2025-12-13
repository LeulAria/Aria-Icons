"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Loader({ className, size = "md" }: LoaderProps) {
  const sizeClasses = {
    sm: "h-3",
    md: "h-4",
    lg: "h-5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center gap-0.5",
        sizeClasses[size],
        className
      )}
    >
      <div className="flex items-end gap-0.5">
        <div className="w-0.5 bg-current rounded-full animate-[loader_1.2s_ease-in-out_infinite] [animation-delay:0s]" />
        <div className="w-0.5 bg-current rounded-full animate-[loader_1.2s_ease-in-out_infinite] [animation-delay:0.2s]" />
        <div className="w-0.5 bg-current rounded-full animate-[loader_1.2s_ease-in-out_infinite] [animation-delay:0.4s]" />
      </div>
    </div>
  );
}

