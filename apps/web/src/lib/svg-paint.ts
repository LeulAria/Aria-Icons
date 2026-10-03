/**
 * Recolor served SVGs per icon instead of flattening every fill to one color.
 *
 * Vendored icons are classified once at pack time (scripts/lib/icon-quality.ts):
 * - "mono":       one paint color — recolored to the requested color.
 * - "color":      multi-color artwork (logos, flags, app icons) — served as drawn.
 * - "gray-dark":  several gray tones drawn for a light background.
 * - "gray-light": several gray tones drawn for a dark background.
 *
 * Gray artwork is inverted when the requested color belongs to the other theme,
 * so it stays legible without losing its tones.
 */
export type SvgPaint = "mono" | "color" | "gray-dark" | "gray-light";

const ROOT_TAG = /<svg\b([^>]*)>/i;

type Rgba = { r: number; g: number; b: number; a: number };

const NAMED_COLORS: Record<string, string> = {
	black: "#000000",
	white: "#ffffff",
	red: "#ff0000",
	green: "#008000",
	lime: "#00ff00",
	blue: "#0000ff",
	yellow: "#ffff00",
	orange: "#ffa500",
	purple: "#800080",
	fuchsia: "#ff00ff",
	magenta: "#ff00ff",
	aqua: "#00ffff",
	cyan: "#00ffff",
	navy: "#000080",
	teal: "#008080",
	maroon: "#800000",
	olive: "#808000",
	silver: "#c0c0c0",
	gray: "#808080",
	grey: "#808080",
	darkgray: "#a9a9a9",
	darkgrey: "#a9a9a9",
	dimgray: "#696969",
	dimgrey: "#696969",
	lightgray: "#d3d3d3",
	lightgrey: "#d3d3d3",
	gainsboro: "#dcdcdc",
	whitesmoke: "#f5f5f5",
};

/**
 * `var(--token, fallback)` paints come from design systems; inside an <img>
 * the custom property is undefined, so the fallback is what actually draws.
 */
function resolveVar(value: string): string {
	let v = value.trim();
	for (let i = 0; i < 4; i++) {
		const m = /^var\(\s*--[\w-]+\s*(?:,\s*([\s\S]+))?\)$/i.exec(v);
		if (!m) break;
		v = (m[1] ?? "").trim();
	}
	return v;
}

export function parseColor(value: string): Rgba | null {
	const v = resolveVar(value).toLowerCase();
	const hex = NAMED_COLORS[v] ?? v;
	let m = /^#([0-9a-f]{3,4})$/.exec(hex);
	if (m) {
		const [r, g, b, a = "f"] = m[1]!.split("");
		return {
			r: Number.parseInt(r! + r!, 16),
			g: Number.parseInt(g! + g!, 16),
			b: Number.parseInt(b! + b!, 16),
			a: Number.parseInt(a + a, 16) / 255,
		};
	}
	m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(hex);
	if (m) {
		const n = m[1]!;
		return {
			r: Number.parseInt(n.slice(0, 2), 16),
			g: Number.parseInt(n.slice(2, 4), 16),
			b: Number.parseInt(n.slice(4, 6), 16),
			a: m[2] ? Number.parseInt(m[2], 16) / 255 : 1,
		};
	}
	m = /^rgba?\(\s*([\d.]+)(%?)[\s,]+([\d.]+)(%?)[\s,]+([\d.]+)(%?)(?:[\s,/]+([\d.]+)(%?))?\s*\)$/.exec(v);
	if (m) {
		const channel = (n: string, pct: string) =>
			Math.min(255, pct ? (Number.parseFloat(n) * 255) / 100 : Number.parseFloat(n));
		const alpha = m[7] == null ? 1 : m[8] ? Number.parseFloat(m[7]) / 100 : Number.parseFloat(m[7]);
		return { r: channel(m[1]!, m[2]!), g: channel(m[3]!, m[4]!), b: channel(m[5]!, m[6]!), a: alpha };
	}
	return null;
}

function luminance({ r, g, b }: Rgba) {
	return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function chroma({ r, g, b }: Rgba) {
	return (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
}

/** Paint values that must survive recoloring: no paint, gradients, inherited. */
function isKeptPaint(value: string): boolean {
	const raw = value.trim().toLowerCase();
	// An unset custom property with no fallback still paints; recolor it.
	if (raw.startsWith("var(")) {
		const fallback = resolveVar(raw);
		return fallback ? isKeptPaint(fallback) : false;
	}
	if (!raw || raw === "none" || raw === "transparent" || raw === "inherit") return true;
	if (raw.startsWith("url(")) return true;
	return parseColor(raw)?.a === 0;
}

/** "light" / "dark" only for near-neutral theme colors; null for brand colors. */
function themeOf(color: string): "light" | "dark" | null {
	const rgba = parseColor(color);
	if (!rgba || chroma(rgba) > 0.12) return null;
	const lum = luminance(rgba);
	if (lum >= 0.6) return "light";
	if (lum <= 0.4) return "dark";
	return null;
}

function rootAttr(attrs: string, name: string) {
	return new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])(.*?)\\1`, "i").exec(attrs)?.[2];
}

function setRootAttr(attrs: string, name: string, value: string) {
	const re = new RegExp(`(^|\\s)${name}\\s*=\\s*(["']).*?\\2`, "i");
	if (re.test(attrs)) return attrs.replace(re, `$1${name}="${value}"`);
	return ` ${name}="${value}"${attrs}`;
}

/**
 * Set the rendered size on the root element only. Matching `\bwidth=` would
 * also hit `stroke-width=` and turn stroke icons into solid blobs.
 */
export function setSvgSize(svg: string, size: string | number) {
	const px = String(size);
	return svg.replace(ROOT_TAG, (_m, attrs: string) => {
		let next = attrs;
		if (rootAttr(next, "viewBox") == null) {
			const width = Number.parseFloat(rootAttr(next, "width") ?? "");
			const height = Number.parseFloat(rootAttr(next, "height") ?? "");
			if (width > 0 && height > 0 && !/%/.test(rootAttr(next, "width") ?? "")) {
				next += ` viewBox="0 0 ${width} ${height}"`;
			}
		}
		next = setRootAttr(next, "width", px);
		next = setRootAttr(next, "height", px);
		return `<svg${next}>`;
	});
}

const PAINT_ATTR =
	/(^|[\s"'])(fill|stroke|stop-color|flood-color|lighting-color|color)(\s*=\s*)(["'])([^"']*)\4/gi;
const PAINT_PROP =
	/(^|[;{\s"'])(fill|stroke|stop-color|flood-color|lighting-color|color)(\s*:\s*)([^;}"']+)/gi;

function recolor(svg: string, pick: (value: string) => string | null) {
	// Mask and clip contents are geometry, not paint: a white mask recolored
	// black (or a black cutout recolored white) breaks the icon.
	const held: string[] = [];
	let next = svg.replace(/<(mask|clipPath)\b[\s\S]*?<\/\1>/gi, (block) => {
		held.push(block);
		return `\u0000${held.length - 1}\u0000`;
	});
	const css = (body: string) =>
		body.replace(PAINT_PROP, (m, lead: string, prop: string, sep: string, value: string) => {
			const swap = pick(value.replace(/!important/i, ""));
			return swap == null ? m : `${lead}${prop}${sep}${swap}`;
		});
	next = next
		.replace(PAINT_ATTR, (m, lead: string, name: string, eq: string, q: string, value: string) => {
			const swap = pick(value);
			return swap == null ? m : `${lead}${name}${eq}${q}${swap}${q}`;
		})
		.replace(/(\sstyle\s*=\s*)(["'])([\s\S]*?)\2/gi, (_m, lead: string, q: string, body: string) => {
			return `${lead}${q}${css(body)}${q}`;
		})
		.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (_m, open: string, body: string, close: string) => {
			return `${open}${css(body)}${close}`;
		});
	return next.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => held[Number(i)] ?? "");
}

/** Recolor a single-color icon: attributes, inline styles, and <style> rules. */
export function tintMonoSvg(svg: string, color: string) {
	const next = recolor(svg.replace(/currentcolor/gi, color), (value) =>
		isKeptPaint(value) ? null : color,
	);
	// Shapes with no paint of their own default to black; inherit the tint instead.
	return next.replace(ROOT_TAG, (m, attrs: string) =>
		rootAttr(attrs, "fill") == null ? `<svg fill="${color}"${attrs}>` : m,
	);
}

const INVERT_FILTER =
	'<filter id="aria-invert" filterUnits="userSpaceOnUse" x="-100%" y="-100%" width="300%" height="300%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0"/></filter>';

/** Invert every tone (black ink becomes white) while keeping transparency. */
export function invertSvg(svg: string) {
	const open = ROOT_TAG.exec(svg);
	const close = svg.lastIndexOf("</svg>");
	if (!open || close < 0) return svg;
	const start = open.index + open[0].length;
	return `${svg.slice(0, start)}<defs>${INVERT_FILTER}</defs><g filter="url(#aria-invert)">${svg.slice(start, close)}</g>${svg.slice(close)}`;
}

/** Swap near-black outline ink for `color`; colored fills stay as drawn. */
export function inkSwapSvg(svg: string, color: string) {
	const isInk = (value: string) => {
		const rgba = parseColor(value);
		return !!rgba && rgba.a > 0 && luminance(rgba) < 0.2 && chroma(rgba) < 0.15;
	};
	const next = recolor(svg, (value) => (isInk(value) ? color : null));
	return next.replace(ROOT_TAG, (m, attrs: string) =>
		rootAttr(attrs, "fill") == null ? `<svg fill="${color}"${attrs}>` : m,
	);
}

/**
 * Markup-only paint guess for sources we can't classify at pack time
 * (Iconify color sets fetched at runtime, loose SVGs). Iconify bodies are
 * normalized, so explicit fill/stroke values are reliable there.
 */
export function classifyPaintMarkup(svg: string): SvgPaint {
	const colors = new Map<string, Rgba>();
	let usesCurrent = false;
	const add = (value: string) => {
		const v = value.trim().toLowerCase();
		if (v === "currentcolor") {
			usesCurrent = true;
			return;
		}
		if (isKeptPaint(v)) return;
		const rgba = parseColor(v);
		// Unknown keywords (hsl(), rare names) count as their own color.
		colors.set(v, rgba ?? { r: 255, g: 0, b: 0, a: 1 });
	};
	for (const m of svg.matchAll(PAINT_ATTR)) add(m[5] ?? "");
	for (const m of svg.matchAll(PAINT_PROP)) add((m[4] ?? "").replace(/!important/i, ""));
	if (/<(?:linear|radial)Gradient\b/i.test(svg) && colors.size > 0) return "color";
	if (usesCurrent) colors.set("currentcolor", { r: 0, g: 0, b: 0, a: 1 });
	if (colors.size <= 1) return "mono";
	const values = [...colors.values()];
	if (values.some((c) => chroma(c) > 0.12)) return "color";
	const lum = values.reduce((sum, c) => sum + luminance(c), 0) / values.length;
	return lum < 0.5 ? "gray-dark" : "gray-light";
}

/** Apply the paint mode for a requested color (the UI asks for the theme ink). */
export function paintSvg(
	svg: string,
	paint: SvgPaint,
	color: string,
	options?: { inkSwap?: boolean },
) {
	switch (paint) {
		case "mono":
			return tintMonoSvg(svg, color);
		case "gray-dark":
			return themeOf(color) === "light" ? invertSvg(svg) : svg;
		case "gray-light":
			return themeOf(color) === "dark" ? invertSvg(svg) : svg;
		case "color":
			return options?.inkSwap && themeOf(color) === "light" ? inkSwapSvg(svg, color) : svg;
	}
}
