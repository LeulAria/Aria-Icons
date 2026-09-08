"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

function applyThemeClass(next: "light" | "dark") {
	const root = document.documentElement;
	root.classList.toggle("dark", next === "dark");
	root.style.colorScheme = next;
}

export function ModeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	const isDark = !mounted || resolvedTheme !== "light";

	const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
		const next: "light" | "dark" = isDark ? "light" : "dark";
		const x = event.clientX;
		const y = event.clientY;
		const endRadius = Math.hypot(
			Math.max(x, window.innerWidth - x),
			Math.max(y, window.innerHeight - y),
		);

		const root = document.documentElement;
		root.style.setProperty("--theme-x", `${x}px`);
		root.style.setProperty("--theme-y", `${y}px`);
		root.style.setProperty("--theme-r", `${Math.ceil(endRadius)}px`);
		root.dataset.themeTo = next;

		const flush = () => {
			applyThemeClass(next);
			setTheme(next);
		};

		const reduceMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		const canTransition =
			!reduceMotion && typeof document.startViewTransition === "function";

		if (!canTransition) {
			flush();
			return;
		}

		root.classList.add("theme-flushing");
		const transition = document.startViewTransition(flush);
		void transition.finished.finally(() => {
			root.classList.remove("theme-flushing");
			delete root.dataset.themeTo;
		});
	};

	return (
		<button
			type="button"
			onClick={toggleTheme}
			aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
			className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground"
		>
			{isDark ? (
				<Sun className="size-3.5" strokeWidth={1.75} />
			) : (
				<Moon className="size-3.5" strokeWidth={1.75} />
			)}
		</button>
	);
}
