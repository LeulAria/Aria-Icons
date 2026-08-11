"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/utils/orpc";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="dark"
			enableSystem={false}
			disableTransitionOnChange
			forcedTheme="dark"
		>
			<QueryClientProvider client={queryClient}>
				<div
					className="flex flex-1 flex-col"
					style={{ flex: 1, minHeight: "100vh", height: "100%" }}
				>
					{children}
				</div>
				{/* <ReactQueryDevtools /> */}
			</QueryClientProvider>
			<Toaster richColors />
		</ThemeProvider>
	);
}
