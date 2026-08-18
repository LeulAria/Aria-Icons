/**
 * Map the inspector stroke slider (24×24 design units, default 1) onto any
 * line SVG — including Iconify sets and large-viewBox packs like Ionicons.
 *
 * Filled icons are left alone. Line icons always get a stroke-width, even when
 * the source omitted one or used a native width the old ≤4 remap skipped.
 */

const DESIGN_SIZE = 24;

export function isFilledStyleId(styleId: string) {
	return /^(solid|filled|fill|bulk|bold)$/i.test(styleId);
}

export function svgUsesStroke(svg: string) {
	if (/\bstroke-width\b|\bstrokeWidth\b/i.test(svg)) return true;
	if (/fill\s*=\s*["']none["']/i.test(svg)) return true;
	if (/fill\s*:\s*none\b/i.test(svg)) return true;
	if (/\bstroke\s*=\s*["'](?!none\b)[^"']+["']/i.test(svg)) return true;
	if (/stroke\s*:\s*(?!none\b)[^;]+/i.test(svg)) return true;
	return false;
}

export function svgHasFillPaint(svg: string) {
	if (/fill\s*=\s*["'](?!none\b)[^"']+["']/i.test(svg)) return true;
	if (/fill\s*:\s*(?!none\b)[^;]+/i.test(svg)) return true;
	return false;
}

function viewBoxMin(svg: string) {
	const match = svg.match(/viewBox\s*=\s*["']([^"']+)["']/i);
	if (!match?.[1]) return DESIGN_SIZE;
	const parts = match[1]
		.trim()
		.split(/[\s,]+/)
		.map((n) => Number.parseFloat(n));
	const width = parts[2];
	const height = parts[3];
	if (width > 0 && height > 0) return Math.min(width, height);
	return DESIGN_SIZE;
}

function formatStroke(value: number) {
	const rounded = Math.round(value * 1000) / 1000;
	if (Number.isInteger(rounded)) return String(rounded);
	return String(rounded);
}

function targetStroke(requested: number, svg: string) {
	const size = viewBoxMin(svg);
	return Math.max(0.05, requested * (size / DESIGN_SIZE));
}

function scaleToken(raw: string, target: number) {
	const trimmed = raw.trim();
	if (/px$/i.test(trimmed)) return `${formatStroke(target)}px`;
	return formatStroke(target);
}

/**
 * Force every stroke-width in `svg` to the slider value, scaled to the
 * icon's viewBox. Injects a root stroke-width when the source has none.
 */
export function applyLineStrokeWidth(svg: string, requested: number) {
	const target = targetStroke(requested, svg);
	const formatted = formatStroke(target);

	let next = svg
		.replace(/\bstroke-width="([^"]*)"/gi, (_m, value: string) => {
			return `stroke-width="${scaleToken(value, target)}"`;
		})
		.replace(/\bstrokeWidth="([^"]*)"/gi, (_m, value: string) => {
			return `strokeWidth="${scaleToken(value, target)}"`;
		})
		.replace(
			/(stroke-width\s*:\s*)([^;}"']+)/gi,
			(_m, lead: string) => `${lead}${formatted}`,
		);

	if (!/\bstroke-width\b/i.test(next) && !/\bstrokeWidth\b/i.test(next)) {
		next = next.replace(/<svg\b([^>]*?)>/i, (match, attrs: string) => {
			if (/\bstroke-width\s*=/i.test(attrs) || /\bstrokeWidth\s*=/i.test(attrs)) {
				return match;
			}
			return `<svg stroke-width="${formatted}"${attrs}>`;
		});
	}

	return next;
}

/** True when this icon should honor the stroke slider. */
export function shouldApplyStroke(opts: {
	group?: string | null;
	styleId?: string | null;
	svg: string;
}) {
	if (opts.group === "solid" || isFilledStyleId(opts.styleId ?? "")) return false;
	if (opts.group === "line") {
		return svgUsesStroke(opts.svg) || !svgHasFillPaint(opts.svg);
	}
	return svgUsesStroke(opts.svg);
}
