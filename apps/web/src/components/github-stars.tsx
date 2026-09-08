"use client";

import { useQuery } from "@tanstack/react-query";

export const GITHUB_REPO_URL = "https://github.com/LeulAria/Aria-Icons";

function formatStars(count: number) {
	if (count < 1000) return String(count);
	const compact = count / 1000;
	const rounded = compact >= 10 ? compact.toFixed(0) : compact.toFixed(1);
	return `${rounded.replace(/\.0$/, "")}k`;
}

function GitHubMark({ className }: { className?: string }) {
	return (
		<svg
			id="i-github"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 64 64"
			width="14"
			height="14"
			aria-hidden
			className={className}
		>
			<path
				strokeWidth="2.667"
				fill="currentColor"
				d="M32 0 C14 0 0 14 0 32 0 53 19 62 22 62 24 62 24 61 24 60 L24 55 C17 57 14 53 13 50 13 50 13 49 11 47 10 46 6 44 10 44 13 44 15 48 15 48 18 52 22 51 24 50 24 48 26 46 26 46 18 45 12 42 12 31 12 27 13 24 15 22 15 22 13 18 15 13 15 13 20 13 24 17 27 15 37 15 40 17 44 13 49 13 49 13 51 20 49 22 49 22 51 24 52 27 52 31 52 42 45 45 38 46 39 47 40 49 40 52 L40 60 C40 61 40 62 42 62 45 62 64 53 64 32 64 14 50 0 32 0 Z"
			/>
		</svg>
	);
}

export function GitHubStars() {
	const { data: stars } = useQuery({
		queryKey: ["github-stars"],
		queryFn: async () => {
			const res = await fetch("/api/github-stars");
			if (!res.ok) return null;
			const body = (await res.json()) as { stars: number | null };
			return typeof body.stars === "number" ? body.stars : null;
		},
		staleTime: 60 * 60 * 1000,
		gcTime: 6 * 60 * 60 * 1000,
	});

	return (
		<a
			href={GITHUB_REPO_URL}
			target="_blank"
			rel="noreferrer"
			aria-label={
				stars == null
					? "Aria Icons on GitHub"
					: `Aria Icons on GitHub, ${stars} stars`
			}
			className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground"
		>
			<GitHubMark className="size-3.5" />
			{stars != null ? (
				<span className="font-mono text-[11px] tabular-nums leading-none">
					{formatStars(stars)}
				</span>
			) : null}
		</a>
	);
}
