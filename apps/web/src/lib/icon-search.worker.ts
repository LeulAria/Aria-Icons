/// <reference lib="webworker" />

export {};

/** Keep in sync with ANIMATED_SET_IDS in animated-sets.ts. */
const ANIMATED_SET_IDS = new Set(["line-md", "svg-spinners", "meteocons"]);

function isAnimatedSet(setId: string) {
	return ANIMATED_SET_IDS.has(setId);
}

type WorkerIcon = {
	setId: string;
	styleId: string;
	filePath: string;
	name: string;
	group: "line" | "solid";
	tags?: string[];
};

type Filters = {
	collection: string;
	styleGroup: "line" | "solid" | "both" | "animated";
	selectedStyleId: string;
};

type InMessage =
	| { type: "init"; icons: WorkerIcon[] }
	| {
			type: "search";
			id: number;
			query: string;
			filters: Filters;
	  };

type OutMessage =
	| { type: "ready"; total: number }
	| { type: "results"; id: number; indices: number[] };

declare const self: DedicatedWorkerGlobalScope;

/** Keep in sync with ICON_SETS order in icon-sets.ts (Feather, Basicons, …). */
const VENDORED_ORDER = [
	"feathers",
	"basicons-line",
	"lucide-icons",
	"tabler-icons",
	"heroicons",
	"iconoir",
	"icons",
	"majesticons",
	"coolicons",
	"akar-icons",
	"system-uicons",
	"bytesize-icons",
	"ikonate",
	"iconicicons",
	"ionicons",
	"iconpack",
];
const VENDORED_RANK = new Map(VENDORED_ORDER.map((id, i) => [id, i]));

function setBrowsePriority(
	setId: string,
	group?: "line" | "solid",
): number {
	const vendored = VENDORED_RANK.get(setId);
	if (vendored != null) return 3_000 + vendored;
	if (setId === "thesvg") return 2_000;
	// Iconify line before Iconify fill
	if (group === "line") return 0;
	return 1_000;
}

let icons: WorkerIcon[] = [];
/** Precomputed lowercase names — makes 300k-icon scans fast. */
let names: string[] = [];

function matchesFilters(icon: WorkerIcon, filters: Filters): boolean {
	const { collection, styleGroup, selectedStyleId } = filters;

	if (collection !== "all" && icon.setId !== collection) return false;

	if (styleGroup === "animated") return isAnimatedSet(icon.setId);

	// Line / Fill / Both is primary. Logos + colored sets are indexed as solid.
	if (styleGroup !== "both" && icon.group !== styleGroup) return false;

	if (
		collection !== "all" &&
		selectedStyleId !== "both" &&
		selectedStyleId !== styleGroup &&
		icon.styleId !== selectedStyleId
	) {
		return false;
	}

	return true;
}

function scoreToken(name: string, icon: WorkerIcon, token: string): number {
	if (name === token) return 100;
	const hitAt = name.indexOf(token);
	if (hitAt === 0) {
		const end = name.charAt(token.length);
		return end === "" || end === "-" || end === "_" ? 90 : 82;
	}
	if (hitAt > 0) {
		const before = name.charAt(hitAt - 1);
		return before === "-" || before === "_" ? 78 : 65;
	}

	let best = 0;
	const tags = icon.tags;
	if (tags) {
		for (const tag of tags) {
			if (tag === token) {
				best = 60;
				break;
			}
			if (best < 48 && tag.startsWith(token)) best = 48;
			else if (best < 35 && tag.includes(token)) best = 35;
		}
	}
	if (best === 0 && icon.setId.includes(token)) best = 25;
	return best;
}

self.onmessage = (event: MessageEvent<InMessage>) => {
	const msg = event.data;

	if (msg.type === "init") {
		icons = msg.icons;
		names = new Array(icons.length);
		for (let i = 0; i < icons.length; i++) {
			names[i] = icons[i]?.name.toLowerCase() ?? "";
		}
		const out: OutMessage = { type: "ready", total: icons.length };
		self.postMessage(out);
		return;
	}

	if (msg.type === "search") {
		const tokens = msg.query.toLowerCase().trim().split(/\s+/).filter(Boolean);
		let indices: number[];

		if (tokens.length === 0) {
			indices = [];
			for (let i = 0; i < icons.length; i++) {
				const icon = icons[i];
				if (icon && matchesFilters(icon, msg.filters)) indices.push(i);
			}
			// Iconify line first when browsing All Icons with no query.
			if (msg.filters.collection === "all") {
				indices.sort((ia, ib) => {
					const a = icons[ia];
					const b = icons[ib];
					if (!a || !b) return 0;
					const bySet =
						setBrowsePriority(a.setId, a.group) -
						setBrowsePriority(b.setId, b.group);
					if (bySet !== 0) return bySet;
					const byName = a.name.localeCompare(b.name);
					if (byName !== 0) return byName;
					return a.setId.localeCompare(b.setId);
				});
			}
		} else {
			const hits: Array<[index: number, score: number]> = [];
			outer: for (let i = 0; i < icons.length; i++) {
				const icon = icons[i];
				if (!icon || !matchesFilters(icon, msg.filters)) continue;
				const name = names[i] ?? "";
				let total = 0;
				for (const token of tokens) {
					const s = scoreToken(name, icon, token);
					if (s === 0) continue outer;
					total += s;
				}
				const score = total / tokens.length - Math.min(name.length * 0.1, 8);
				hits.push([i, score]);
			}
			hits.sort((a, b) => {
				const byScore = b[1] - a[1];
				if (byScore !== 0) return byScore;
				return (names[a[0]] ?? "").localeCompare(names[b[0]] ?? "");
			});
			indices = hits.map((h) => h[0]);
		}

		const out: OutMessage = { type: "results", id: msg.id, indices };
		self.postMessage(out);
	}
};
