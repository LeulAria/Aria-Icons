import * as React from "react";
import { Slot as SlotPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors duration-100 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
	{
		variants: {
			variant: {
				default:
					"bg-foreground text-background hover:bg-foreground/90",
				destructive:
					"bg-destructive text-foreground hover:bg-destructive/90",
				outline:
					"border border-foreground/10 bg-background/50 text-foreground hover:bg-foreground/5 hover:border-foreground/20",
				secondary:
					"bg-foreground/10 text-foreground hover:bg-foreground/20",
				ghost:
					"text-foreground hover:bg-foreground/5",
				link: "text-foreground underline-offset-4 hover:underline",
			},
			size: {
				default: "h-9 px-5 py-2 has-[>svg]:px-4",
				sm: "h-8 gap-1.5 px-5 has-[>svg]:px-3",
				lg: "h-10 px-6 has-[>svg]:px-4",
				icon: "size-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? SlotPrimitive.Slot : "button";

	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
