"use client";

import type * as React from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster"
			position="bottom-right"
			closeButton
			duration={2800}
			visibleToasts={4}
			expand
			style={
				{
					// Override all toast variants to white
					"--normal-bg": "#ffffff",
					"--normal-text": "#0a0a0a",
					"--normal-border": "rgba(0,0,0,0.08)",
					"--success-bg": "#ffffff",
					"--success-text": "#0a0a0a",
					"--success-border": "rgba(0,0,0,0.08)",
					"--error-bg": "#ffffff",
					"--error-text": "#0a0a0a",
					"--error-border": "rgba(0,0,0,0.08)",
					"--warning-bg": "#ffffff",
					"--warning-text": "#0a0a0a",
					"--warning-border": "rgba(0,0,0,0.08)",
					"--info-bg": "#ffffff",
					"--info-text": "#0a0a0a",
					"--info-border": "rgba(0,0,0,0.08)",
				} as React.CSSProperties
			}
			toastOptions={{
				classNames: {
					toast: [
						"group toast",
						"bg-white text-zinc-950",
						"border border-black/10 shadow-md",
						"rounded-xl",
						"px-3.5 py-2.5",
						"backdrop-blur-sm",
					].join(" "),
					title: "text-[13px] font-bold leading-5",
					description: "text-[12px] font-normal leading-4 text-zinc-600 -mt-0.5",
					actionButton: [
						"inline-flex items-center justify-center whitespace-nowrap",
						"rounded-full px-2.5 py-1 text-[11px] font-medium",
						"bg-zinc-900 text-white",
						"hover:bg-zinc-800",
						"transition-colors",
					].join(" "),
					cancelButton: [
						"inline-flex items-center justify-center whitespace-nowrap",
						"rounded-full px-2.5 py-1 text-[11px] font-medium",
						"bg-zinc-100 text-zinc-900",
						"hover:bg-zinc-200",
						"transition-colors",
					].join(" "),
				},
			}}
			{...props}
		/>
	);
};

export { Toaster };
