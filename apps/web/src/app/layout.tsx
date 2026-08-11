import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import Header from "@/components/header";
import { Analytics } from "@vercel/analytics/react";

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
		<html
			lang="en"
			suppressHydrationWarning
			className="dark"
			style={{ height: "100%", minHeight: "100vh", backgroundColor: "#000" }}
		>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
				style={{
					height: "100%",
					minHeight: "100vh",
					margin: 0,
					display: "flex",
					flexDirection: "column",
					backgroundColor: "#000",
					color: "#fff",
				}}
			>
				<Analytics />
				<Providers>
					<div
						className="app-shell"
						style={{
							flex: 1,
							display: "flex",
							flexDirection: "column",
							height: "100vh",
							minHeight: "100vh",
							overflow: "hidden",
							backgroundColor: "#000",
						}}
					>
						<Header />
						<div
							style={{
								flex: 1,
								minHeight: 0,
								minWidth: 0,
								overflow: "hidden",
								display: "flex",
								flexDirection: "column",
							}}
						>
							{children}
						</div>
					</div>
				</Providers>
			</body>
		</html>
	);
}
