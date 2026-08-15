const REPO = "LeulAria/Aria-Icons";

export const revalidate = 3600;

export async function GET() {
	try {
		const res = await fetch(`https://api.github.com/repos/${REPO}`, {
			headers: {
				Accept: "application/vnd.github+json",
				"User-Agent": "aria-icons",
			},
			next: { revalidate: 3600 },
		});

		if (!res.ok) {
			return Response.json({ stars: null }, { status: 200 });
		}

		const data = (await res.json()) as { stargazers_count?: number };
		const stars =
			typeof data.stargazers_count === "number" ? data.stargazers_count : null;

		return Response.json(
			{ stars },
			{
				headers: {
					"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
				},
			},
		);
	} catch {
		return Response.json({ stars: null }, { status: 200 });
	}
}
