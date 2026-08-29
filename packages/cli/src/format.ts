import type { Framework, IconFormat } from "./types.ts";
import { toPascalCase, toSnakeCase } from "./utils.ts";

export function compactSvg(svg: string): string {
  return svg
    .replace(/\s+/g, " ")
    .replace(/\s*>\s*/g, ">")
    .replace(/\s*<\s*/g, "<")
    .trim();
}

function prettyInner(inner: string, indent = "    "): string {
  if (!inner) return "";
  return inner
    .replace(/></g, `>\n${indent}<`)
    .replace(/^/, indent);
}

export function wrapSvg(svg: string, openAttrs: string): string {
  const compact = compactSvg(svg);
  const match = compact.match(/^<svg([^>]*)>([\s\S]*)<\/svg>$/i);
  if (!match) return compact.replace("<svg", `<svg${openAttrs}`);
  const existing = match[1] ?? "";
  const inner = prettyInner(match[2] ?? "");
  return `<svg${openAttrs}${existing}>\n${inner}\n  </svg>`;
}

function svgToJsx(svg: string) {
  return svg
    .replace(/\s([a-z]+)-([a-z])/g, (_, a: string, b: string) => ` ${a}${b.toUpperCase()}`)
    .replace(/clip-path=/g, "clipPath=")
    .replace(/fill-rule=/g, "fillRule=")
    .replace(/stroke-width=/g, "strokeWidth=")
    .replace(/stroke-linecap=/g, "strokeLinecap=")
    .replace(/stroke-linejoin=/g, "strokeLinejoin=")
    .replace(/stroke-miterlimit=/g, "strokeMiterlimit=")
    .replace(/stroke-dasharray=/g, "strokeDasharray=")
    .replace(/stroke-opacity=/g, "strokeOpacity=")
    .replace(/fill-opacity=/g, "fillOpacity=")
    .replace(/class=/g, "className=");
}

function svgToSolid(svg: string) {
  return svgToJsx(svg).replace(/className=/g, "class=");
}

function toReactNativeSvg(jsx: string) {
  return jsx
    .replace(/<svg/g, "<Svg")
    .replace(/<\/svg>/g, "</Svg>")
    .replace(/<path/g, "<Path")
    .replace(/<\/path>/g, "</Path>")
    .replace(/<g/g, "<G")
    .replace(/<\/g>/g, "</G>")
    .replace(/<circle/g, "<Circle")
    .replace(/<\/circle>/g, "</Circle>")
    .replace(/<rect/g, "<Rect")
    .replace(/<\/rect>/g, "</Rect>")
    .replace(/<line/g, "<Line")
    .replace(/<\/line>/g, "</Line>")
    .replace(/<polyline/g, "<Polyline")
    .replace(/<\/polyline>/g, "</Polyline>")
    .replace(/<polygon/g, "<Polygon")
    .replace(/<\/polygon>/g, "</Polygon>");
}

export function formatIcon(
  svg: string,
  name: string,
  format: IconFormat | Framework,
  iconId?: string,
): string {
  const component = toPascalCase(name) || "Icon";
  const snake = toSnakeCase(name) || "icon";
  const comment = iconId ? `// ${iconId}\n` : "";
  const jsx = svgToJsx(wrapSvg(svg, " {...props}"));
  const vue = wrapSvg(svg, ' v-bind="$attrs"');
  const svelte = wrapSvg(svg, " {...props}");
  const solid = svgToSolid(wrapSvg(svg, " {...props}"));

  switch (format) {
    case "svg":
    case "html":
      return compactSvg(svg);
    case "jsx":
      return jsx;
    case "json":
      return JSON.stringify({ name, svg: compactSvg(svg) }, null, 2);
    case "react":
      return `${comment}import type { SVGProps } from "react";\n\nexport function ${component}(props: SVGProps<SVGSVGElement>) {\n  return (\n    ${jsx}\n  );\n}\n`;
    case "react-native":
      return `${comment}import Svg, { Path, G, Circle, Rect, Line, Polyline, Polygon } from "react-native-svg";\nimport type { SvgProps } from "react-native-svg";\n\nexport function ${component}(props: SvgProps) {\n  return (\n    ${toReactNativeSvg(jsx)}\n  );\n}\n`;
    case "vue":
      return `<!-- ${iconId ?? name} -->\n<template>\n  ${vue}\n</template>\n`;
    case "svelte":
      return `<!-- ${iconId ?? name} -->\n<script lang="ts">\n  let props = $props();\n</script>\n\n${svelte}\n`;
    case "solid":
      return `${comment}import type { JSX } from "solid-js";\n\nexport function ${component}(props: JSX.SvgSVGAttributes<SVGSVGElement>) {\n  return (\n    ${solid}\n  );\n}\n`;
    case "flutter":
      return `${comment}// flutter pub add flutter_svg\nimport 'package:flutter/material.dart';\nimport 'package:flutter_svg/flutter_svg.dart';\n\nclass ${component} extends StatelessWidget {\n  const ${component}({super.key, this.width, this.height, this.color});\n\n  final double? width;\n  final double? height;\n  final Color? color;\n\n  static const String _svg = r'''${compactSvg(svg)}''';\n\n  @override\n  Widget build(BuildContext context) {\n    return SvgPicture.string(\n      _svg,\n      width: width,\n      height: height,\n      colorFilter: color == null ? null : ColorFilter.mode(color!, BlendMode.srcIn),\n    );\n  }\n}\n`;
    default:
      return compactSvg(svg);
  }
}

export function fileExtension(framework: Framework): string {
  switch (framework) {
    case "react":
    case "react-native":
      return "tsx";
    case "solid":
      return "tsx";
    case "vue":
      return "vue";
    case "svelte":
      return "svelte";
    case "flutter":
      return "dart";
    default:
      return "svg";
  }
}
