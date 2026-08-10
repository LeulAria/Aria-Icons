import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import Header from "@/components/header";
import {Analytics} from "@vercel/analytics/react"

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "aria-icons",
	description: "aria-icons",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning className="dark min-h-dvh">
			<body
				className={`${geistSans.variable} ${geistMono.variable} min-h-dvh antialiased`}
			>
				<Analytics />
				<Providers>
					<div className="grid h-dvh min-h-dvh grid-rows-[auto_1fr] overflow-hidden">
						<Header />
						{children}
					</div>
				</Providers>
			</body>
		</html>
	);
}
