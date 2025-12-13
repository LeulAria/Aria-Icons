import { NextResponse } from "next/server";
import { ICON_SETS } from "@/lib/icon-sets";
import { buildIconIndex } from "@/lib/icon-fs";

export const runtime = "nodejs";

export async function GET() {
	// Build counts lazily (cached in-memory by `buildIconIndex`).
	const sets = await Promise.all(
		ICON_SETS.map(async (set) => {
			const styles = await Promise.all(
				set.styles.map(async (style) => {
					const idx = await buildIconIndex(set.id, style.id);
					return { ...style, count: idx.icons.length };
				}),
			);
			return {
				id: set.id,
				label: set.label,
				homepage: set.homepage ?? null,
				styles: styles.map((s) => ({
					id: s.id,
					label: s.label,
					group: s.group,
					count: s.count,
				})),
			};
		}),
	);

	return NextResponse.json({ sets });
}


