import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<
	HTMLInputElement,
	React.ComponentProps<"input">
>(function Input({ className, type, ...props }, ref) {
	return (
		<input
			ref={ref}
			type={type}
			data-slot="input"
			className={cn(
				"file:text-foreground placeholder:text-muted-foreground selection:bg-white/20 selection:text-white border-white/10 flex h-10 w-full min-w-0 rounded-lg border bg-black/50 px-3 py-2 text-sm text-white transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				"focus-visible:border-white/20 focus-visible:bg-black/80",
				"aria-invalid:border-destructive",
				className,
			)}
			{...props}
		/>
	);
});

export { Input };
