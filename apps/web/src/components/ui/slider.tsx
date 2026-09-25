import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

const TICK_COUNT = 61;

function Slider({
	className,
	variant = "default",
	...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
	variant?: "default" | "ticks";
}) {
	const ticks = variant === "ticks";

	return (
		<SliderPrimitive.Root
			data-slot="slider"
			className={cn(
				"relative flex w-full touch-none select-none items-center",
				ticks && "h-7",
				className,
			)}
			{...props}
		>
			<SliderPrimitive.Track
				data-slot="slider-track"
				className={cn(
					"relative w-full grow",
					ticks
						? "h-7 bg-transparent"
						: "h-1 overflow-hidden rounded-full bg-foreground/15",
				)}
			>
				{ticks ? (
					<span
						aria-hidden
						className="pointer-events-none absolute inset-0 flex items-center justify-between"
					>
						{Array.from({ length: TICK_COUNT }, (_, index) => {
							const major = index % 4 === 0;
							return (
								<span
									key={index}
									className={cn(
										"shrink-0 rounded-full bg-foreground",
										major
											? "h-3.5 w-px opacity-80"
											: "h-2 w-px opacity-35",
									)}
								/>
							);
						})}
					</span>
				) : (
					<SliderPrimitive.Range
						data-slot="slider-range"
						className="absolute h-full bg-foreground"
					/>
				)}
			</SliderPrimitive.Track>
			<SliderPrimitive.Thumb
				data-slot="slider-thumb"
				className={cn(
					"block focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
					ticks
						? "z-10 h-[18px] w-[30px] cursor-grab rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.28),0_0_0_0.5px_rgba(0,0,0,0.18)] transition-transform hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-foreground/25 active:cursor-grabbing data-[state=active]:scale-[1.04]"
						: "size-3.5 rounded-full bg-foreground shadow-sm transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-foreground/30",
				)}
			/>
		</SliderPrimitive.Root>
	);
}

export { Slider };
