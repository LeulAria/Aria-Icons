"use client";

import { useQuery } from "@tanstack/react-query";
import { Github } from "lucide-react";

export const GITHUB_REPO_URL = "https://github.com/LeulAria/Aria-Icons";

function formatStars(count: number) {
	if (count < 1000) return String(count);
	const compact = count / 1000;
	const rounded = compact >= 10 ? compact.toFixed(0) : compact.toFixed(1);
	return `${rounded.replace(/\.0$/, "")}k`;
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
			className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
		>
			<Github className="size-3.5" strokeWidth={1.75} />
			{stars != null ? (
				<span className="font-mono text-[11px] tabular-nums leading-none">
					{formatStars(stars)}
				</span>
			) : null}
		</a>
	);
}
