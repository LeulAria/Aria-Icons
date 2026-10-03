import {
	classifyPaintMarkup,
	paintSvg,
	setSvgSize,
	type SvgPaint,
	tintMonoSvg,
} from "./svg-paint";

export type SvgCustomize = {
	size?: number;
	color?: string;
	/** When true (default), single-color icons paint with currentColor. */
	theming?: boolean;
	/** Pack-time paint class; guessed from the markup when omitted. */
	paint?: SvgPaint;
};

/** Turn a single-color icon into a themeable mark. Multi-color art is left alone. */
export function applyCurrentColor(svg: string, paint: SvgPaint = classifyPaintMarkup(svg)): string {
	return paint === "mono" ? tintMonoSvg(svg, "currentColor") : svg;
}

export function applySvgCustomize(svg: string, options?: SvgCustomize): string {
	const paint = options?.paint ?? classifyPaintMarkup(svg);
	let next = options?.theming === false ? svg : applyCurrentColor(svg, paint);
	if (!options) return next;

	if (options.size != null && Number.isFinite(options.size)) {
		next = setSvgSize(next, options.size);
	}

	const color = options.color?.trim();
	if (color && color !== "currentColor") next = paintSvg(next, paint, color);

	return next;
}
