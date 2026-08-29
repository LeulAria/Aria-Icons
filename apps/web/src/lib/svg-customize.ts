export type SvgCustomize = {
	size?: number;
	color?: string;
	/** When true (default), monochrome hardcoded fills become currentColor. */
	theming?: boolean;
};

const HARD_FILL = /\bfill="(?!none|url\()([^"]+)"/gi;

/** Turn a single-color logo into a themeable mark. Multi-color art is left alone. */
export function applyCurrentColor(svg: string): string {
	if (/currentColor/i.test(svg)) return svg;

	const fills = new Set<string>();
	HARD_FILL.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = HARD_FILL.exec(svg))) {
		const value = match[1].trim().toLowerCase();
		if (value && value !== "transparent") fills.add(value);
	}
	if (fills.size > 1) return svg;
	if (fills.size === 1) {
		return svg.replace(HARD_FILL, 'fill="currentColor"');
	}
	if (!/\bstroke=/i.test(svg) && /<path\b/i.test(svg)) {
		return svg.replace(/<svg\b/i, '<svg fill="currentColor"');
	}
	return svg;
}

export function applySvgCustomize(svg: string, options?: SvgCustomize): string {
	let next = options?.theming === false ? svg : applyCurrentColor(svg);
	if (!options) return next;

	if (options.size != null && Number.isFinite(options.size)) {
		const size = String(options.size);
		next = next.replace(/<svg\b([^>]*?)>/i, (_m, attrs: string) => {
			let patched = attrs;
			if (/\bwidth=/.test(patched)) {
				patched = patched.replace(/\bwidth="[^"]*"/, `width="${size}"`);
			} else {
				patched = ` width="${size}"${patched}`;
			}
			if (/\bheight=/.test(patched)) {
				patched = patched.replace(/\bheight="[^"]*"/, `height="${size}"`);
			} else {
				patched = ` height="${size}"${patched}`;
			}
			return `<svg${patched}>`;
		});
	}

	const color = options.color?.trim();
	if (color && color !== "currentColor") {
		next = next
			.replaceAll("currentColor", color)
			.replaceAll("currentcolor", color)
			.replace(/\bstroke="(?!none)[^"]*"/gi, `stroke="${color}"`)
			.replace(/\bfill="(?!none)[^"]*"/gi, `fill="${color}"`);
	}

	return next;
}
