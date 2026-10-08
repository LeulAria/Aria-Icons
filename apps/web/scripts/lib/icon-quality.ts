/**
 * Pack-time quality pass for vendored icons.
 *
 * 1. Repair markup browsers refuse to draw inside <img>: missing xmlns,
 *    leftover JSX/Svelte syntax, unquoted attributes, editor namespaces.
 * 2. Rasterize every icon (resvg) to classify its paint (see src/lib/svg-paint.ts)
 *    and reject icons that are blank, solid blocks, or raster images wrapped in SVG.
 * 3. Collapse byte-identical icons inside a set; alias names become search tags.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import { SaxesParser } from "saxes";
import type { PackedIcon } from "../../src/lib/icon-packed";
import { classifyPaintMarkup, paintSvg, setSvgSize, type SvgPaint } from "../../src/lib/svg-paint";

export type RejectReason = "markup" | "text" | "raster" | "external" | "blank" | "solid" | "duplicate";

let wasmReady: Promise<void> | null = null;

/** Load the resvg wasm module once per process. */
export function initRenderer() {
	if (!wasmReady) {
		const candidates = [
			path.join(process.cwd(), "node_modules/@resvg/resvg-wasm/index_bg.wasm"),
			path.join(process.cwd(), "../../node_modules/@resvg/resvg-wasm/index_bg.wasm"),
		];
		const file = candidates.find((p) => fs.existsSync(p));
		if (!file) throw new Error("@resvg/resvg-wasm is not installed (bun install in apps/web)");
		wasmReady = initWasm(fs.readFileSync(file));
	}
	return wasmReady;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

/** Editor/private namespaces whose elements and attributes never affect rendering. */
const EDITOR_PREFIXES =
	"sodipodi|inkscape|sketch|serif|rdf|cc|dc|i|x|a|graph|figma|bx|vectornator|krita|ns\\d*|osb|xodm|adobe|illustrator";

const XML_ENTITIES = new Set(["amp", "lt", "gt", "quot", "apos"]);
const HTML_ENTITIES: Record<string, string> = {
	nbsp: "&#160;",
	copy: "&#169;",
	reg: "&#174;",
	trade: "&#8482;",
	hellip: "&#8230;",
	mdash: "&#8212;",
	ndash: "&#8211;",
};

/** JSX attribute spellings that are not valid SVG/XML attribute names. */
const JSX_ATTRS: Record<string, string> = {
	className: "class",
	xlinkHref: "xlink:href",
	xmlnsXlink: "xmlns:xlink",
	xmlSpace: "xml:space",
	strokeWidth: "stroke-width",
	strokeLinecap: "stroke-linecap",
	strokeLinejoin: "stroke-linejoin",
	strokeMiterlimit: "stroke-miterlimit",
	strokeDasharray: "stroke-dasharray",
	strokeDashoffset: "stroke-dashoffset",
	strokeOpacity: "stroke-opacity",
	fillRule: "fill-rule",
	fillOpacity: "fill-opacity",
	clipRule: "clip-rule",
	clipPath: "clip-path",
	stopColor: "stop-color",
	stopOpacity: "stop-opacity",
	floodColor: "flood-color",
	floodOpacity: "flood-opacity",
	colorInterpolationFilters: "color-interpolation-filters",
	textAnchor: "text-anchor",
	fontFamily: "font-family",
	fontSize: "font-size",
	fontWeight: "font-weight",
	dominantBaseline: "dominant-baseline",
	vectorEffect: "vector-effect",
	shapeRendering: "shape-rendering",
	paintOrder: "paint-order",
	maskType: "mask-type",
};

/** SVG is case-sensitive; HTML serializers lowercase these names and break them. */
const CAMEL_NAMES = new Map(
	[
		"linearGradient", "radialGradient", "clipPath", "textPath", "foreignObject", "animateMotion",
		"animateTransform", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite",
		"feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow",
		"feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge",
		"feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight",
		"feTile", "feTurbulence", "viewBox", "preserveAspectRatio", "gradientUnits", "gradientTransform",
		"patternUnits", "patternContentUnits", "patternTransform", "maskUnits", "maskContentUnits",
		"clipPathUnits", "filterUnits", "primitiveUnits", "stdDeviation", "baseFrequency", "numOctaves",
		"kernelMatrix", "tableValues", "spreadMethod", "startOffset", "textLength", "lengthAdjust",
		"markerWidth", "markerHeight", "markerUnits", "refX", "refY", "pathLength", "keyTimes",
		"keySplines", "calcMode", "attributeName", "attributeType", "repeatCount", "repeatDur",
		"diffuseConstant", "surfaceScale", "specularExponent", "specularConstant", "kernelUnitLength",
		"xChannelSelector", "yChannelSelector", "edgeMode", "targetX", "targetY", "limitingConeAngle",
		"pointsAtX", "pointsAtY", "pointsAtZ", "requiredExtensions", "requiredFeatures", "systemLanguage",
	].map((name) => [name.toLowerCase(), name]),
);

/** Resolve JSX/Svelte/Vue template syntax to static markup; null when it can't be. */
function stripTemplating(svg: string): string | null {
	// CSS rules and text content legitimately contain braces.
	const held: string[] = [];
	let s = svg.replace(/<(style|text)\b[\s\S]*?<\/\1>/gi, (block) => {
		held.push(block);
		return `\u0001${held.length - 1}\u0001`;
	});
	const templated = /[{}]/.test(s) || /\sclassName=|\s(?:on|bind|use|class):[\w-]/.test(s);
	if (templated) {
		// Svelte control blocks ({#if}, {#each}) depend on runtime state.
		if (/\{[#:/@][a-z]/i.test(s)) return null;
		s = s
			.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
			.replace(/\s\{\s*\.\.\.(?:[^{}]|\{[^{}]*\})*\}/g, "")
			.replace(
				/\s(?:on|bind|use|transition|in|out|animate|class|style):[\w|.-]+(?:\s*=\s*(?:\{(?:[^{}]|\{[^{}]*\})*\}|"[^"]*"|'[^']*'))?/g,
				"",
			)
			.replace(/(\s[\w:-]+)\s*=\s*\{\s*(["'`])([^"'`{}]*)\2\s*\}/g, '$1="$3"')
			.replace(/(\s[\w:-]+)\s*=\s*\{\s*(-?[\d.]+)\s*\}/g, '$1="$2"')
			.replace(/(\s(?:stroke-width|strokeWidth))\s*=\s*\{[^{}]*\}/g, '$1="2"')
			.replace(/(\s(?:width|height))\s*=\s*\{[^{}]*\}/g, '$1="24"')
			.replace(/(\s(?:fill|stroke|color))\s*=\s*\{[^{}]*\}/g, '$1="currentColor"')
			.replace(/\s[\w:@.-]+\s*=\s*\{(?:[^{}]|\{[^{}]*\})*\}/g, "")
			.replace(/\{(?:[^{}<>]|\{[^{}<>]*\})*\}/g, "");
		if (/[{}]/.test(s)) return null;
	}
	return s.replace(/\u0001(\d+)\u0001/g, (_m, i: string) => held[Number(i)] ?? "");
}

/** Quote values, drop bare/invalid/duplicate attributes, map JSX names. */
function fixTag(tag: string) {
	const m = /^<([A-Za-z_][\w:.-]*)([\s\S]*?)(\/?)>$/.exec(tag);
	if (!m) return tag;
	const [, rawName, body, selfClose] = m;
	const name = CAMEL_NAMES.get(rawName!) ?? rawName;
	const seen = new Set<string>();
	let out = `<${name}`;
	for (const a of body!.matchAll(/([^\s=/]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g)) {
		let key = a[1]!;
		let value = a[2];
		if (value == null) continue;
		key = JSX_ATTRS[key] ?? CAMEL_NAMES.get(key) ?? key;
		if (!/^[A-Za-z_][\w:.-]*$/.test(key) || /^on/i.test(key)) continue;
		if (seen.has(key)) continue;
		seen.add(key);
		if (!/^["']/.test(value)) value = `"${value}"`;
		out += ` ${key}=${value}`;
	}
	return `${out}${selfClose ? "/" : ""}>`;
}

function rootAttrs(svg: string) {
	return /<svg\b([^>]*)>/i.exec(svg)?.[1] ?? "";
}

function attr(attrs: string, name: string) {
	return new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])(.*?)\\1`, "i").exec(attrs)?.[2];
}

/** Viewport size from viewBox, else numeric width/height. Null when unusable. */
export function svgViewport(svg: string): { w: number; h: number } | null {
	const attrs = rootAttrs(svg);
	const vb = attr(attrs, "viewBox");
	if (vb != null) {
		const n = vb.trim().split(/[\s,]+/).map(Number);
		if (n.length === 4 && n.every(Number.isFinite) && n[2]! > 0 && n[3]! > 0) {
			return { w: n[2]!, h: n[3]! };
		}
		return null;
	}
	const w = Number.parseFloat(attr(attrs, "width") ?? "");
	const h = Number.parseFloat(attr(attrs, "height") ?? "");
	return w > 0 && h > 0 ? { w, h } : null;
}

export function xmlError(svg: string): string | null {
	const parser = new SaxesParser({ xmlns: true });
	let error: string | null = null;
	parser.on("error", (e) => {
		error ??= e.message;
	});
	try {
		parser.write(svg).close();
	} catch (e) {
		error ??= String((e as Error).message ?? e);
	}
	return error;
}

function isWhitePaint(value: string | undefined) {
	const v = (value ?? "").trim().toLowerCase();
	return v === "white" || v === "#fff" || v === "#ffffff" || /^rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)$/.test(v);
}

/**
 * Drop a white rectangle that fills the whole canvas behind the glyph — an
 * export artifact (Figma frames, Illustrator artboards) that turns the icon
 * into a white tile on dark backgrounds.
 */
function dropWhitePlate(svg: string): string {
	const view = svgViewport(svg);
	const open = /<svg\b[^>]*>/i.exec(svg);
	if (!view || !open) return svg;
	const [ox, oy] = (attr(rootAttrs(svg), "viewBox") ?? "0 0").trim().split(/[\s,]+/).map(Number);
	// Blank out non-rendered containers but keep offsets, then find the first shape.
	const rendered = svg.replace(/<(defs|mask|clipPath|pattern|symbol|marker)\b[\s\S]*?<\/\1>/gi, (m) => " ".repeat(m.length));
	const shape = /<(rect|path|circle|ellipse|polygon|polyline|line|use|image|text|g)\b[^>]*>/gi;
	shape.lastIndex = open.index + open[0].length;
	const first = shape.exec(rendered);
	if (!first || first[1]!.toLowerCase() === "g") return svg;
	const tag = first[0];
	const style = attr(tag, "style") ?? "";
	const fill = /(?:^|;)\s*fill\s*:\s*([^;]+)/i.exec(style)?.[1] ?? attr(tag, "fill");
	const stroke = /(?:^|;)\s*stroke\s*:\s*([^;]+)/i.exec(style)?.[1] ?? attr(tag, "stroke");
	if (!isWhitePaint(fill) || (stroke && stroke.trim() !== "none") || attr(tag, "transform")) return svg;
	// Rounded corners mean a designed tile, not an artboard.
	if (attr(tag, "rx") || attr(tag, "ry")) return svg;
	const near = (a: number, b: number) => Math.abs(a - b) <= Math.max(0.01, b * 0.002);
	let covers = false;
	if (first[1]!.toLowerCase() === "rect") {
		const size = (name: string, full: number) => {
			const v = attr(tag, name);
			return v === "100%" || (v != null && near(Number.parseFloat(v), full));
		};
		const pos = (name: string, origin: number) => {
			const v = attr(tag, name);
			return v == null || near(Number.parseFloat(v) || 0, origin);
		};
		covers = size("width", view.w) && size("height", view.h) && pos("x", ox ?? 0) && pos("y", oy ?? 0);
	} else if (first[1]!.toLowerCase() === "path") {
		const nums = (attr(tag, "d") ?? "").match(/-?\d*\.?\d+(?:e-?\d+)?/gi)?.map(Number) ?? [];
		const d = (attr(tag, "d") ?? "").replace(/[\s,]+/g, "");
		covers =
			/^M[-\d.]+[-\d.]*[hH][-\d.]+[vV][-\d.]+[hH][-\d.]+(?:[vV][-\d.]+)?[zZ]$/.test(d) &&
			nums.length >= 5 &&
			near(Math.abs(nums[2]! - (/h/.test(d) ? 0 : nums[0]!)), view.w) &&
			near(Math.abs(nums[3]!), view.h);
	}
	if (!covers) return svg;
	return svg.slice(0, first.index) + svg.slice(first.index + tag.length).replace(/^<\/rect>|^<\/path>/i, "");
}

/** Repair markup so a browser renders it as an image. Null when beyond repair. */
export function repairSvgMarkup(raw: string): string | null {
	let s = raw.replace(/^﻿/, "");
	// Illustrator declares namespaces as DTD entities (&ns_svg;); expand them before the DOCTYPE goes.
	const entities = new Map<string, string>();
	for (const m of s.matchAll(/<!ENTITY\s+([\w.-]+)\s+(["'])([\s\S]*?)\2\s*>/g)) {
		entities.set(m[1]!, m[3]!);
	}
	if (entities.size) s = s.replace(/&([\w.-]+);/g, (m, n: string) => entities.get(n) ?? m);

	const start = s.search(/<svg\b/i);
	const end = s.toLowerCase().lastIndexOf("</svg>");
	if (start < 0 || end < start) return null;
	s = s.slice(start, end + 6);

	const editor = new RegExp(`<(${EDITOR_PREFIXES}):[\\w.-]+\\b[^>]*\\/>`, "g");
	const editorBlock = new RegExp(`<((?:${EDITOR_PREFIXES}):[\\w.-]+)\\b[^>]*>[\\s\\S]*?<\\/\\1>`, "g");
	s = s
		.replace(/<!--[\s\S]*?-->/g, "")
		.replace(/<(metadata|title|desc|script|foreignObject)\b[^>]*\/>/gi, "")
		.replace(/<(metadata|title|desc|script|foreignObject)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
		.replace(editorBlock, "")
		.replace(editor, "");

	const untemplated = stripTemplating(s);
	if (untemplated == null) return null;
	s = untemplated;

	s = s
		.replace(/<[A-Za-z_][^<>]*>/g, fixTag)
		.replace(/<\/([A-Za-z][\w.-]*)\s*>/g, (_m, name: string) => `</${CAMEL_NAMES.get(name) ?? name}>`);
	// Editor attributes (inkscape:label …) and their namespace declarations.
	s = s
		.replace(new RegExp(`\\s(?:${EDITOR_PREFIXES}):[\\w.-]+=("[^"]*"|'[^']*')`, "g"), "")
		.replace(new RegExp(`\\sxmlns:(?:${EDITOR_PREFIXES})=("[^"]*"|'[^']*')`, "g"), "")
		.replace(/&(?!#\d+;|#x[0-9a-f]+;)([\w.-]+);/gi, (m, name: string) =>
			XML_ENTITIES.has(name) ? m : (HTML_ENTITIES[name.toLowerCase()] ?? ""),
		)
		.replace(/&(?!#\d+;|#x[0-9a-f]+;|[\w.-]+;)/gi, "&amp;")
		.replace(/currentcolor/gi, "currentColor")
		.replace(/\s+/g, " ")
		.replace(/>\s+</g, "><")
		.trim();

	// Empty wrappers left behind by editors.
	for (let i = 0; i < 4; i++) {
		const before = s;
		s = s
			.replace(/<(g|defs|style)\b[^>]*\/>/gi, "")
			.replace(/<(g|defs|style)\b[^>]*><\/\1>/gi, "");
		if (s === before) break;
	}

	s = s.replace(/<svg\b([^>]*)>/i, (_m, attrs: string) => {
		let next = attrs;
		if (attr(next, "xmlns") == null) next = ` xmlns="${SVG_NS}"${next}`;
		if (/\sxlink:/.test(s) && attr(next, "xmlns:xlink") == null) next += ` xmlns:xlink="${XLINK_NS}"`;
		if (/<svg:/.test(s) && attr(next, "xmlns:svg") == null) next += ` xmlns:svg="${SVG_NS}"`;
		if (attr(next, "viewBox") == null) {
			const w = attr(next, "width") ?? "";
			const h = attr(next, "height") ?? "";
			const wn = Number.parseFloat(w);
			const hn = Number.parseFloat(h);
			if (wn > 0 && hn > 0 && !w.includes("%") && !h.includes("%")) {
				next += ` viewBox="0 0 ${wn} ${hn}"`;
			}
		}
		return `<svg${next}>`;
	});

	if (!svgViewport(s)) return null;
	if (!xmlError(s)) return s;
	// HTML-style unclosed shapes (<path d="…">) — close them and drop stray end tags.
	const closed = s
		.replace(/<(path|rect|circle|ellipse|line|polyline|polygon|stop|use)\b([^>]*?)\s*(?<!\/)>/g, "<$1$2/>")
		.replace(/<\/(path|rect|circle|ellipse|line|polyline|polygon|stop|use)>/g, "");
	return xmlError(closed) ? null : closed;
}

/** Raster pixels or external files: not a vector icon, or broken off-site. */
export function referencedAssets(svg: string): "raster" | "external" | null {
	for (const m of svg.matchAll(/<(image|feImage|use)\b[^>]*?\s(?:xlink:)?href\s*=\s*(["'])([^"']*)\2/gi)) {
		const href = m[3]!.trim();
		if (href.startsWith("#")) continue;
		if (/^data:image\/svg\+xml/i.test(href)) continue;
		if (/^data:/i.test(href)) return "raster";
		return "external";
	}
	if (/url\(\s*["']?(?:https?:|\/\/)/i.test(svg) || /@import\b/i.test(svg)) return "external";
	return null;
}

type Raster = { w: number; h: number; px: Uint8Array };

let textFont: Uint8Array | null | undefined;

/** Text-based icons (keyboard layouts, letter emoji) need a font to draw like a browser would. */
function fallbackFont() {
	if (textFont === undefined) {
		const candidates = [
			"/System/Library/Fonts/Supplemental/Arial.ttf",
			"/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
			"/usr/share/fonts/TTF/DejaVuSans.ttf",
		];
		const file = candidates.find((p) => fs.existsSync(p));
		textFont = file ? new Uint8Array(fs.readFileSync(file)) : null;
	}
	return textFont;
}

function rasterize(svg: string, size: number): Raster | null {
	const view = svgViewport(svg);
	if (!view) return null;
	const fitWide = view.w >= view.h;
	let resvg: InstanceType<typeof Resvg> | null = null;
	try {
		const font = /<text\b/i.test(svg) ? fallbackFont() : null;
		resvg = new Resvg(setSvgSize(svg, size), {
			fitTo: { mode: fitWide ? "width" : "height", value: size },
			...(font
				? {
						font: {
							fontBuffers: [font],
							defaultFontFamily: "Arial",
							sansSerifFamily: "Arial",
							serifFamily: "Arial",
							monospaceFamily: "Arial",
						},
					}
				: {}),
		});
		const out = resvg.render();
		const raster = { w: out.width, h: out.height, px: out.pixels };
		out.free();
		return raster;
	} catch {
		// resvg panics on a few exotic files (traps in wasm); browsers may still draw them.
		return null;
	} finally {
		try {
			resvg?.free();
		} catch {
			/* already released by a trap */
		}
	}
}

export type PaintStats = {
	/** Alpha-weighted pixel mass, in pixels. */
	mass: number;
	/** Share of the canvas that is (mostly) opaque. */
	coverage: number;
	/** Opaque share of the opaque pixels' bounding box. */
	bboxFill: number;
	/** Share of paint mass held by the single most common color. */
	dominant: number;
	/** That most common color is clearly chromatic (not black, white, or gray). */
	dominantChromatic: boolean;
	/** Share of paint mass that is clearly chromatic. */
	colored: number;
	meanLum: number;
};

function paintStats({ w, h, px }: Raster): PaintStats {
	const bins = new Float64Array(4096);
	let mass = 0;
	let opaque = 0;
	let colored = 0;
	let lum = 0;
	let minX = w;
	let minY = h;
	let maxX = -1;
	let maxY = -1;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = (y * w + x) * 4;
			const a = px[i + 3]!;
			if (a < 24) continue;
			// resvg returns premultiplied RGBA.
			const r = Math.min(255, (px[i]! * 255) / a);
			const g = Math.min(255, (px[i + 1]! * 255) / a);
			const b = Math.min(255, (px[i + 2]! * 255) / a);
			const wt = a / 255;
			mass += wt;
			if (a >= 128) {
				opaque++;
				if (x < minX) minX = x;
				if (y < minY) minY = y;
				if (x > maxX) maxX = x;
				if (y > maxY) maxY = y;
			}
			if (Math.max(r, g, b) - Math.min(r, g, b) > 40) colored += wt;
			lum += ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) * wt;
			bins[((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)]! += wt;
		}
	}
	let top = 0;
	let topKey = 0;
	for (let k = 0; k < bins.length; k++) {
		if (bins[k]! > top) {
			top = bins[k]!;
			topKey = k;
		}
	}
	// Un-premultiply rounding nudges edge pixels into neighbor bins; count them too.
	let dominant = 0;
	const tr = topKey >> 8;
	const tg = (topKey >> 4) & 15;
	const tb = topKey & 15;
	for (let dr = -1; dr <= 1; dr++)
		for (let dg = -1; dg <= 1; dg++)
			for (let db = -1; db <= 1; db++) {
				const r = tr + dr;
				const g = tg + dg;
				const b = tb + db;
				if (r < 0 || g < 0 || b < 0 || r > 15 || g > 15 || b > 15) continue;
				dominant += bins[(r << 8) | (g << 4) | b]!;
			}
	const bboxArea = maxX >= 0 ? (maxX - minX + 1) * (maxY - minY + 1) : 0;
	return {
		mass,
		coverage: opaque / (w * h),
		bboxFill: bboxArea ? opaque / bboxArea : 0,
		dominant: mass ? dominant / mass : 0,
		dominantChromatic: (Math.max(tr, tg, tb) - Math.min(tr, tg, tb)) * 16 > 40,
		colored: mass ? colored / mass : 0,
		meanLum: mass ? lum / mass : 0,
	};
}

export function classifyPaint(stats: PaintStats): SvgPaint {
	if (stats.dominant >= 0.99) return "mono";
	if (stats.colored <= 0.01) return stats.meanLum < 0.5 ? "gray-dark" : "gray-light";
	return "color";
}

const RENDER_PX = 64;

export type IconVerdict =
	| { ok: true; svg: string; paint: SvgPaint }
	| { ok: false; reason: Exclude<RejectReason, "duplicate"> };

/** Repair, classify, and verify one icon the way the server will paint it. */
export function inspectIcon(raw: string): IconVerdict {
	let svg = repairSvgMarkup(raw);
	if (!svg) return { ok: false, reason: "markup" };
	const assets = referencedAssets(svg);
	if (assets) return { ok: false, reason: assets };
	// Glyphs from an icon font (<text> only) depend on fonts the viewer won't have.
	const drawnShapes = svg.replace(/<(defs|mask|clipPath|pattern|symbol|marker)\b[\s\S]*?<\/\1>/gi, "");
	if (/<text\b/i.test(drawnShapes) && !/<(path|rect|circle|ellipse|line|polyline|polygon|use|image)\b/i.test(drawnShapes)) {
		return { ok: false, reason: "text" };
	}

	let drawn = rasterize(svg, RENDER_PX);
	if (!drawn) return { ok: true, svg, paint: classifyPaintMarkup(svg) };
	let stats = paintStats(drawn);
	if (stats.mass < 8) {
		// Design-system icons often leave paint to site CSS: a root fill="none"
		// over filled shapes, or bare open paths meant to be stroked.
		const view = svgViewport(svg)!;
		const width = Math.round((Math.min(view.w, view.h) / 12) * 100) / 100;
		const attempts = [
			svg.replace(/<svg\b([^>]*)>/i, (_m, attrs: string) =>
				`<svg${attrs.replace(/\sfill\s*=\s*(["'])none\1/i, "")}>`,
			),
			svg.replace(/<svg\b([^>]*)>/i, (_m, attrs: string) => {
				const rest = attrs.replace(/\s(fill|stroke|stroke-width|stroke-linecap|stroke-linejoin)\s*=\s*(["'])[^"']*\2/gi, "");
				return `<svg fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${rest}>`;
			}),
		];
		let fixed: { svg: string; drawn: Raster } | null = null;
		for (const attempt of attempts) {
			if (attempt === svg) continue;
			const retry = rasterize(attempt, RENDER_PX);
			if (retry && paintStats(retry).mass >= 8) {
				fixed = { svg: attempt, drawn: retry };
				break;
			}
		}
		if (!fixed) return { ok: false, reason: "blank" };
		svg = fixed.svg;
		drawn = fixed.drawn;
		stats = paintStats(drawn);
	}
	// A gray plate filling the whole canvas: a lost glyph, wrong viewBox, or traced
	// background. Chromatic plates are kept (colored-square emoji are real icons).
	if (
		stats.dominant >= 0.97 &&
		!stats.dominantChromatic &&
		stats.coverage >= 0.95 &&
		stats.bboxFill >= 0.985
	) {
		return { ok: false, reason: "solid" };
	}
	// A white artboard behind one dark glyph is an export artifact; flags, cards
	// and tiles keep their white field because what remains is colored or mixed.
	const unplated = dropWhitePlate(svg);
	if (unplated !== svg) {
		const glyph = rasterize(unplated, RENDER_PX);
		const glyphStats = glyph ? paintStats(glyph) : null;
		if (
			glyphStats &&
			glyphStats.mass >= 8 &&
			glyphStats.dominant >= 0.99 &&
			!glyphStats.dominantChromatic &&
			glyphStats.meanLum < 0.4
		) {
			svg = unplated;
			stats = glyphStats;
		}
	}
	const paint = classifyPaint(stats);

	// What the dark UI receives must still draw something.
	const served = rasterize(paintSvg(svg, paint, "#ffffff"), RENDER_PX);
	if (served && paintStats(served).mass < 8) return { ok: false, reason: "blank" };
	return { ok: true, svg, paint };
}

export type RefineReport = {
	before: number;
	after: number;
	rejected: Record<RejectReason, number>;
	paints: Record<SvgPaint, number>;
	examples: Partial<Record<RejectReason, string>>;
};

/**
 * Run the quality pass over one packed set. Keeps the first-sorted, shortest
 * name among byte-identical icons and records the others as tags.
 */
export function refineIcons(icons: Record<string, PackedIcon>): {
	icons: Record<string, PackedIcon>;
	report: RefineReport;
} {
	const report: RefineReport = {
		before: Object.keys(icons).length,
		after: 0,
		rejected: { markup: 0, text: 0, raster: 0, external: 0, blank: 0, solid: 0, duplicate: 0 },
		paints: { mono: 0, color: 0, "gray-dark": 0, "gray-light": 0 },
		examples: {},
	};
	const groups = new Map<string, { key: string; icon: PackedIcon; aliases: string[] }>();
	for (const [key, icon] of Object.entries(icons)) {
		const verdict = inspectIcon(icon.svg);
		if (!verdict.ok) {
			report.rejected[verdict.reason]++;
			report.examples[verdict.reason] ??= key;
			continue;
		}
		const next: PackedIcon = { ...icon, svg: verdict.svg };
		if (verdict.paint === "mono") delete next.paint;
		else next.paint = verdict.paint;
		const hashKey = `${icon.styleId}\u0000${verdict.svg}`;
		const group = groups.get(hashKey);
		if (!group) {
			groups.set(hashKey, { key, icon: next, aliases: [] });
			continue;
		}
		report.rejected.duplicate++;
		const keepNew =
			next.name.length < group.icon.name.length ||
			(next.name.length === group.icon.name.length && next.name < group.icon.name);
		if (keepNew) {
			group.aliases.push(group.icon.name);
			group.key = key;
			const tags = [...(group.icon.tags ?? []), ...(next.tags ?? [])];
			group.icon = { ...next, ...(tags.length ? { tags } : {}) };
		} else {
			group.aliases.push(next.name);
		}
	}
	const out: Record<string, PackedIcon> = {};
	for (const { key, icon, aliases } of groups.values()) {
		if (aliases.length) {
			const tags = new Set([...(icon.tags ?? []), ...aliases.map((a) => a.toLowerCase())]);
			tags.delete(icon.name.toLowerCase());
			icon.tags = [...tags].slice(0, 24);
		}
		out[key] = icon;
		report.paints[icon.paint ?? "mono"]++;
	}
	report.after = Object.keys(out).length;
	return { icons: out, report };
}

export function svgHash(svg: string) {
	return createHash("sha1").update(svg).digest("hex");
}

type HashCache = Record<string, { stamp: string; hashes: string[] }>;

/**
 * Hash → owning set for every packed icon, except sets about to be (re)packed.
 * Hashes are cached per pack (keyed by size + mtime) so a run doesn't re-read
 * gigabytes of JSON just to dedupe one new family.
 */
export async function buildPackHashIndex(vendoredDir: string, skip: Set<string>) {
	const cacheFile = path.join(os.tmpdir(), "aria-pack-hashes.json");
	let cache: HashCache = {};
	try {
		cache = JSON.parse(await fs.promises.readFile(cacheFile, "utf8")) as HashCache;
	} catch {
		/* first run */
	}
	const index = new Map<string, string>();
	const next: HashCache = {};
	for (const file of await fs.promises.readdir(vendoredDir)) {
		if (!file.endsWith(".json")) continue;
		const setId = file.slice(0, -5);
		if (skip.has(setId)) continue;
		const stat = await fs.promises.stat(path.join(vendoredDir, file));
		const stamp = `${stat.size}:${stat.mtimeMs}`;
		let hashes = cache[setId]?.stamp === stamp ? cache[setId]!.hashes : null;
		if (!hashes) {
			const raw = await fs.promises.readFile(path.join(vendoredDir, file), "utf8");
			// Shallow clones leave some large packs as Git LFS pointers.
			if (raw.startsWith("version https://git-lfs.github.com/")) {
				continue;
			}
			const pack = JSON.parse(raw) as {
				icons: Record<string, PackedIcon>;
			};
			hashes = Object.values(pack.icons).map((icon) => svgHash(icon.svg));
		}
		next[setId] = { stamp, hashes };
		for (const hash of hashes) index.set(hash, setId);
	}
	await fs.promises.writeFile(cacheFile, JSON.stringify(next), "utf8");
	return index;
}

/**
 * Drop icons byte-identical to one another family already ships, so a theme
 * forked from an imported theme only adds the artwork it actually changed.
 * Registers the survivors so later sets in the same run dedupe against them.
 */
export function dropForeignDuplicates(
	setId: string,
	icons: Record<string, PackedIcon>,
	index: Map<string, string>,
) {
	const kept: Record<string, PackedIcon> = {};
	let dropped = 0;
	for (const [key, icon] of Object.entries(icons)) {
		const hash = svgHash(icon.svg);
		const owner = index.get(hash);
		if (owner && owner !== setId) {
			dropped++;
			continue;
		}
		index.set(hash, setId);
		kept[key] = icon;
	}
	return { icons: kept, dropped };
}
