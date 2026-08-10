export type IconExportCustomize = {
  size: number;
  stroke: number;
  color: string;
};

export type CopyFormat =
  | "svg"
  | "react"
  | "react-native"
  | "vue"
  | "html"
  | "jsx"
  | "solid"
  | "flutter"
  | "data-uri";

export type IconExportRef = {
  setId: string;
  styleId: string;
  filePath: string;
  name: string;
};

export type CopyFormatSetup = {
  install: string;
  usage: string;
};

function toPascalCase(name: string) {
  return name
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function toSnakeCase(name: string) {
  return name
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

export function buildIconSvgUrl(
  icon: Pick<IconExportRef, "setId" | "styleId" | "filePath">,
  customize: IconExportCustomize,
) {
  const params = new URLSearchParams();
  params.set("setId", icon.setId);
  params.set("styleId", icon.styleId);
  params.set("filePath", icon.filePath);
  params.set("size", String(customize.size));
  params.set("strokeWidth", String(customize.stroke));
  params.set("color", customize.color);
  return `/api/icon-svg?${params.toString()}`;
}

export async function fetchIconSvg(
  icon: Pick<IconExportRef, "setId" | "styleId" | "filePath">,
  customize: IconExportCustomize,
) {
  const res = await fetch(buildIconSvgUrl(icon, customize));
  if (!res.ok) throw new Error("Failed to load SVG");
  return res.text();
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

function svgToSolidJsx(svg: string) {
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
    .replace(/fill-opacity=/g, "fillOpacity=");
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
    .replace(/<\/polygon>/g, "</Polygon>")
    .replace("<Svg", "<Svg {...props}");
}

export function formatIconExport(
  svg: string,
  name: string,
  format: CopyFormat,
): string {
  const component = toPascalCase(name) || "Icon";
  const snake = toSnakeCase(name) || "icon";
  const jsx = svgToJsx(svg);
  const solidJsx = svgToSolidJsx(svg);

  switch (format) {
    case "svg":
      return svg;
    case "html":
      return svg;
    case "jsx":
      return jsx;
    case "react":
      return `export function ${component}(props) {\n  return (\n    ${jsx.replace("<svg", "<svg {...props}")}\n  );\n}\n`;
    case "react-native":
      return `// How to run:\n//   npm install react-native-svg\n//   # or with Expo:\n//   npx expo install react-native-svg\n\nimport Svg, { Path, G, Circle, Rect, Line, Polyline, Polygon } from "react-native-svg";\n\nexport function ${component}(props) {\n  return (\n    ${toReactNativeSvg(jsx)}\n  );\n}\n`;
    case "vue":
      return `<template>\n  ${svg}\n</template>\n`;
    case "solid":
      return `export function ${component}(props) {\n  return (\n    ${solidJsx.replace("<svg", "<svg {...props}")}\n  );\n}\n`;
    case "flutter":
      return `// How to run:\n//   flutter pub add flutter_svg\n\nimport 'package:flutter/material.dart';\nimport 'package:flutter_svg/flutter_svg.dart';\n\nclass ${component} extends StatelessWidget {\n  const ${component}({super.key, this.width, this.height, this.color});\n\n  final double? width;\n  final double? height;\n  final Color? color;\n\n  static const String _svg = r'''${svg}''';\n\n  @override\n  Widget build(BuildContext context) {\n    return SvgPicture.string(\n      _svg,\n      width: width,\n      height: height,\n      colorFilter: color == null\n          ? null\n          : ColorFilter.mode(color!, BlendMode.srcIn),\n    );\n  }\n}\n\n// Usage:\n// ${component}(width: 24, height: 24)\n// or: SvgPicture.string(${snake}Svg)\n`;
    case "data-uri":
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    default:
      return svg;
  }
}

export const COPY_FORMAT_LABELS: Record<CopyFormat, string> = {
  svg: "SVG",
  react: "React",
  "react-native": "React Native",
  vue: "Vue",
  html: "HTML",
  jsx: "JSX",
  solid: "Solid",
  flutter: "Flutter",
  "data-uri": "Data URI",
};

export const COPY_FORMAT_LOGOS: Partial<Record<CopyFormat, string>> = {
  svg: "/frameworks/svg.svg",
  react: "/frameworks/react.svg",
  "react-native": "/frameworks/react-native.svg",
  vue: "/frameworks/vue.svg",
  html: "/frameworks/html.svg",
  solid: "/frameworks/solid.svg",
  flutter: "/frameworks/flutter.svg",
};

export const COPY_FORMAT_SETUP: Partial<Record<CopyFormat, CopyFormatSetup>> = {
  "react-native": {
    install: "npm install react-native-svg\n# or with Expo:\nnpx expo install react-native-svg",
    usage:
      "Import the copied component and render it like any other React Native view.",
  },
  flutter: {
    install: "flutter pub add flutter_svg",
    usage:
      "Paste the widget into your project, then use IconName(width: 24, height: 24).",
  },
};
