export type IconExportCustomize = {
  size: number;
  stroke: number;
  color: string;
};

export const DARK_ICON_COLOR = "#ffffff";
export const LIGHT_ICON_COLOR = "#171717";

export function themeIconColor(theme?: string | null) {
  return theme === "light" ? LIGHT_ICON_COLOR : DARK_ICON_COLOR;
}

export function isThemeDefaultIconColor(color: string) {
  const value = color.toLowerCase();
  return value === DARK_ICON_COLOR || value === LIGHT_ICON_COLOR;
}

export type CopyFormat =
  | "svg"
  | "react"
  | "react-native"
  | "vue"
  | "svelte"
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
  icon: Pick<IconExportRef, "setId" | "styleId" | "filePath"> & {
    group?: string;
  },
  customize: IconExportCustomize,
) {
  const params = new URLSearchParams();
  params.set("setId", icon.setId);
  params.set("styleId", icon.styleId);
  params.set("filePath", icon.filePath);
  params.set("size", String(customize.size));
  params.set("strokeWidth", String(customize.stroke));
  params.set("color", customize.color);
  if (icon.group) params.set("group", icon.group);
  // Bump when SVG tinting / stroke mapping changes so grids don't keep stale SVGs.
  params.set("v", "4");
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
      return `<template>\n  ${svg.replace("<svg", '<svg v-bind="$attrs"')}\n</template>\n`;
    case "svelte":
      return `<script lang="ts">\n  let props = $props();\n</script>\n\n${svg.replace("<svg", "<svg {...props}")}\n`;
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
  svelte: "Svelte",
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
  svelte: "/frameworks/svelte.svg",
  html: "/frameworks/html.svg",
  solid: "/frameworks/solid.svg",
  flutter: "/frameworks/flutter.svg",
};

export type CliFramework =
  | "react"
  | "vue"
  | "svelte"
  | "solid"
  | "flutter"
  | "react-native"
  | "svg";

export type CliAction = "add" | "get";
export type CliRunner = "npx" | "bunx" | "pnpx" | "yarn";

export const CLI_RUNNER_PREFIX: Record<CliRunner, string> = {
  npx: "npx -y aria-icons@latest",
  bunx: "bunx aria-icons@latest",
  pnpx: "pnpx aria-icons@latest",
  yarn: "yarn dlx aria-icons@latest",
};

export const CLI_RUNNERS: {
  id: CliRunner;
  label: string;
  logo: string;
}[] = [
  { id: "npx", label: "npx", logo: "/package-managers/npx.svg" },
  { id: "bunx", label: "bunx", logo: "/package-managers/bun.svg" },
  { id: "pnpx", label: "pnpx", logo: "/package-managers/pnpm.svg" },
  { id: "yarn", label: "yarn", logo: "/package-managers/yarn.svg" },
];

export const CLI_FRAMEWORKS: {
  id: CliFramework;
  label: string;
  logo?: string;
}[] = [
  { id: "react", label: "React", logo: "/frameworks/react.svg" },
  { id: "vue", label: "Vue", logo: "/frameworks/vue.svg" },
  { id: "svelte", label: "Svelte", logo: "/frameworks/svelte.svg" },
  { id: "solid", label: "Solid", logo: "/frameworks/solid.svg" },
  { id: "flutter", label: "Flutter", logo: "/frameworks/flutter.svg" },
  { id: "react-native", label: "React Native", logo: "/frameworks/react-native.svg" },
  { id: "svg", label: "SVG", logo: "/frameworks/svg.svg" },
];

export const CLI_ACTIONS: { id: CliAction; label: string; hint: string }[] = [
  {
    id: "add",
    label: "add",
    hint: "Writes the icon into your project as source files. Run from the repo root.",
  },
  {
    id: "get",
    label: "get",
    hint: "Prints the icon source to the terminal. Does not write files.",
  },
];

function shellQuote(value: string) {
  if (/^[A-Za-z0-9_./:@+-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

const SHORT_COLLECTION_NAMES: Record<string, string> = {
  "lucide-icons": "lucide",
  "tabler-icons": "tabler",
  feathers: "feather",
  ionicons: "ion",
  "akar-icons": "akar",
  "bytesize-icons": "bytesize",
  iconicicons: "iconic",
};

export function toCliIconId(setId: string, name: string) {
  return `${SHORT_COLLECTION_NAMES[setId] ?? setId}:${name}`;
}

export function buildAriaIconsCliCommand({
  runner,
  action,
  ids,
  framework,
  size,
  color,
}: {
  runner: CliRunner;
  action: CliAction;
  ids: string[];
  framework: CliFramework;
  size: number;
  color: string;
}) {
  const bin = CLI_RUNNER_PREFIX[runner];
  const iconIds = (action === "get" ? ids.slice(0, 1) : ids).map(shellQuote);
  const flags: string[] = [];
  if (action === "add") {
    if (framework !== "svg") flags.push(`--framework ${framework}`);
  } else if (framework !== "svg") {
    flags.push(`--format ${framework}`);
  }
  if (size !== 24) flags.push(`--size ${size}`);
  if (color.toLowerCase() !== "#ffffff") {
    flags.push(`--color ${shellQuote(color)}`);
  }
  return [bin, action, ...iconIds, ...flags].join(" ");
}

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
