import {
  buildPlan,
  cubicsToPathD,
  iconToCubics,
  resampleIcon,
  type SpringPreset,
} from "morphicons";
import { svgToIcon } from "morphicons/adapters";
import {
  fetchIconSvg,
  type IconExportCustomize,
  type IconExportRef,
} from "@/lib/icon-export";
import { iconKey } from "@/lib/icon-workspace";

export type MorphSpring = SpringPreset;

export const MORPH_SPRINGS: MorphSpring[] = ["smooth", "snappy", "bouncy"];
export const MORPH_STROKES = [1, 1.5, 2, 2.5] as const;
export const MAX_MORPH_SEQUENCE = 12;

export const MORPH_HOLD_MS: Record<MorphSpring, number> = {
  smooth: 1050,
  snappy: 780,
  bouncy: 1250,
};

export type MorphCopyFormat =
  | "react"
  | "vue"
  | "svelte"
  | "react-native"
  | "html"
  | "vanilla";

export const MORPH_COPY_FORMATS: MorphCopyFormat[] = [
  "react",
  "vue",
  "svelte",
  "react-native",
  "html",
  "vanilla",
];

export const MORPH_COPY_LABELS: Record<MorphCopyFormat, string> = {
  react: "React",
  vue: "Vue",
  svelte: "Svelte",
  "react-native": "React Native",
  html: "HTML",
  vanilla: "Vanilla",
};

export const MORPH_COPY_LOGOS: Record<MorphCopyFormat, string> = {
  react: "/frameworks/react.svg",
  vue: "/frameworks/vue.svg",
  svelte: "/frameworks/svelte.svg",
  "react-native": "/frameworks/react-native.svg",
  html: "/frameworks/html.svg",
  vanilla: "/frameworks/js.svg",
};

export type MorphCopySetup = {
  install: string;
  usage: string;
};

export const MORPH_COPY_SETUP: Record<MorphCopyFormat, MorphCopySetup> = {
  react: {
    install: "npm install morphicons",
    usage: "Paste the component and toggle `icon` — morphicons animates the change.",
  },
  vue: {
    install: "npm install morphicons",
    usage: "Bind `:icon` to state. Changing it morphs; no AnimatePresence needed.",
  },
  svelte: {
    install: "npm install morphicons",
    usage: "Pass `icon={...}` and update the value. Requires Svelte 5.",
  },
  "react-native": {
    install:
      "npm install morphicons react-native-svg\n# or with Expo:\nnpx expo install react-native-svg\nnpm install morphicons",
    usage: "Same `icon` prop as web. Metro needs package exports (default since RN 0.79).",
  },
  html: {
    install: "npm install morphicons",
    usage: "Define <morph-icon> once, then set `.icon` or call `morphTo()` on the element.",
  },
  vanilla: {
    install: "npm install morphicons",
    usage: "Point createMorph at an SVG <path>, then morphTo() / set() / seek().",
  },
};

export type MorphPath = {
  key: string;
  name: string;
  d: string;
};

export type MorphReadout = {
  pair: string;
  math: string;
  verdict: string;
  pure: boolean;
};

export type MorphCompatCheck = {
  ok: boolean;
  label: string;
};

export type MorphCompatibility = {
  score: number;
  pair: string;
  ready: boolean;
  checks: MorphCompatCheck[];
};

const pathCache = new Map<string, Promise<string>>();

function compactSvg(svg: string) {
  return svg
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function svgToMorphD(svg: string) {
  const input = svgToIcon(compactSvg(svg));
  if (typeof input === "string") return input;
  return cubicsToPathD(iconToCubics(input));
}

export function morphErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : "Unknown error";
  if (/fill/i.test(raw) && /stroke/i.test(raw)) {
    return "Fill icons can't morph. Switch to a line style.";
  }
  if (/transform/i.test(raw)) {
    return "This icon uses transforms, which morphicons can't interpolate.";
  }
  if (/unsupported|element|tag/i.test(raw)) {
    return "This icon's markup isn't stroke-morphable.";
  }
  return raw;
}

export function loadMorphPath(icon: IconExportRef): Promise<string> {
  const key = iconKey(icon);
  let pending = pathCache.get(key);
  if (!pending) {
    pending = fetchIconSvg(icon, {
      size: 24,
      stroke: 2,
      color: "currentColor",
    }).then(svgToMorphD);
    pathCache.set(key, pending);
    pending.catch(() => {
      pathCache.delete(key);
    });
  }
  return pending;
}

export async function loadMorphPaths(
  icons: IconExportRef[],
): Promise<MorphPath[]> {
  return Promise.all(
    icons.map(async (icon) => ({
      key: iconKey(icon),
      name: icon.name,
      d: await loadMorphPath(icon),
    })),
  );
}

function fmtDeg(rad: number) {
  const deg = Math.round((rad * 180) / Math.PI);
  return `${deg}°`;
}

export function morphReadout(
  from: MorphPath | null,
  to: MorphPath,
): MorphReadout {
  if (!from || from.key === to.key) {
    return {
      pair: to.name,
      math: "add another icon to morph",
      verdict: "waiting for a second icon",
      pure: false,
    };
  }

  const a = resampleIcon(from.d);
  const b = resampleIcon(to.d);
  const plan = buildPlan(a, b);
  const items = plan.items;
  if (items.length === 0) {
    return {
      pair: `${from.name} → ${to.name}`,
      math: "no plan",
      verdict: "couldn't align these shapes",
      pure: false,
    };
  }

  const shown = items.slice(0, 4);
  const more = items.length > 4 ? ` +${items.length - 4}` : "";
  const theta = shown.map((it) => fmtDeg(it.theta)).join(" ");
  const maxRes = Math.max(...items.map((it) => it.res));
  const maxTh = Math.max(...items.map((it) => Math.abs(it.theta)));
  const subs =
    a.length === b.length
      ? `${items.length}sp`
      : `${a.length}→${b.length}sp`;

  let verdict: string;
  let pure = false;
  if (maxRes < 0.03 && maxTh > 0.09) {
    verdict = "pure rotation";
    pure = true;
  } else if (maxRes < 0.03) {
    verdict = "pure similarity";
    pure = true;
  } else if (maxRes < 0.3) {
    verdict = "rotation + residual morph";
  } else {
    verdict = "coordinate morph, aligned frame";
  }
  if (a.length !== b.length) verdict += " · cell division";

  return {
    pair: `${from.name} → ${to.name}`,
    math: `${subs} θ [${theta}${more}] res ${maxRes.toFixed(3)}`,
    verdict,
    pure,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function morphCompatibility(
  from: MorphPath | null,
  to: MorphPath | null,
): MorphCompatibility {
  const waiting: MorphCompatibility = {
    score: 0,
    pair: [from?.name, to?.name].filter(Boolean).join(" → "),
    ready: false,
    checks: [
      { ok: false, label: "Similar path structure" },
      { ok: false, label: "Compatible geometry" },
      { ok: false, label: "Stroke compatible" },
      { ok: false, label: "Good interpolation" },
    ],
  };

  if (!from || !to || from.key === to.key) return waiting;

  try {
    const a = resampleIcon(from.d);
    const b = resampleIcon(to.d);
    const plan = buildPlan(a, b);
    const items = plan.items;
    if (items.length === 0) {
      return {
        score: 12,
        pair: `${from.name} → ${to.name}`,
        ready: true,
        checks: [
          { ok: false, label: "Path topology differs" },
          { ok: false, label: "May produce distortion" },
          { ok: false, label: "Stroke topology mismatch" },
          { ok: false, label: "Uneven interpolation" },
        ],
      };
    }

    const structureOk = a.length === b.length;
    const closedA = a.filter((sub) => sub.closed).length;
    const closedB = b.filter((sub) => sub.closed).length;
    const maxRes = Math.max(...items.map((item) => item.res));
    const ptsA = a.reduce((n, sub) => n + sub.pts.length, 0);
    const ptsB = b.reduce((n, sub) => n + sub.pts.length, 0);
    const density = Math.min(ptsA, ptsB) / Math.max(ptsA, ptsB, 1);
    const strokeOk = density > 0.45 && Math.abs(closedA - closedB) <= 1;
    const geometryOk = maxRes < 0.3;
    const interpOk = structureOk && maxRes < 0.12;

    const checks: MorphCompatCheck[] = [
      {
        ok: structureOk,
        label: structureOk ? "Similar path structure" : "Path topology differs",
      },
      {
        ok: geometryOk,
        label: geometryOk ? "Compatible geometry" : "May produce distortion",
      },
      {
        ok: strokeOk,
        label: strokeOk ? "Stroke compatible" : "Stroke topology mismatch",
      },
      {
        ok: interpOk,
        label: interpOk ? "Good interpolation" : "Uneven interpolation",
      },
    ];

    let score = 0;
    score += structureOk
      ? 28
      : Math.max(0, 28 - Math.abs(a.length - b.length) * 10);
    score += Math.round(32 * (1 - clamp(maxRes / 0.85, 0, 1)));
    score += strokeOk ? 18 : 6;
    score += interpOk ? 22 : Math.round(22 * (1 - clamp(maxRes / 0.5, 0, 1)));
    score = Math.round(clamp(score, 8, 99));
    if (structureOk && geometryOk && strokeOk && interpOk && maxRes < 0.03) {
      score = Math.max(score, 92);
    }

    return {
      score,
      pair: `${from.name} → ${to.name}`,
      ready: true,
      checks,
    };
  } catch {
    return {
      ...waiting,
      pair: `${from.name} → ${to.name}`,
      ready: true,
      checks: [
        { ok: false, label: "Path topology differs" },
        { ok: false, label: "May produce distortion" },
        { ok: false, label: "Stroke topology mismatch" },
        { ok: false, label: "Uneven interpolation" },
      ],
      score: 18,
    };
  }
}

function toCamelCase(name: string) {
  const pascal = name
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  if (!pascal) return "icon";
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function identFor(name: string, used: Set<string>) {
  let base = toCamelCase(name).replace(/[^a-zA-Z0-9_$]/g, "");
  if (!base) base = "icon";
  if (/^[0-9]/.test(base)) base = `icon${base}`;
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}${n++}`;
  }
  used.add(id);
  return id;
}

function constBlock(idents: string[], paths: MorphPath[]) {
  return paths
    .map((path, i) => `const ${idents[i]} = ${JSON.stringify(path.d)};`)
    .join("\n");
}

export function formatMorphExport(
  paths: MorphPath[],
  format: MorphCopyFormat,
  customize: IconExportCustomize,
  spring: MorphSpring,
): string {
  if (paths.length < 2) {
    throw new Error("A morph needs at least two icons.");
  }

  const used = new Set<string>();
  const idents = paths.map((path) => identFor(path.name, used));
  const a = idents[0]!;
  const b = idents[1]!;
  const consts = constBlock(idents, paths);
  const many = paths.length > 2;
  const size = customize.size;
  const stroke = customize.stroke;
  const color = customize.color;
  const iconList = `[${idents.join(", ")}]`;

  switch (format) {
    case "react":
      return many
        ? `import { useState } from "react";
import { MorphIcon } from "morphicons/react";

${consts}

const ICONS = ${iconList};

export function IconMorph() {
  const [index, setIndex] = useState(0);
  return (
    <button
      type="button"
      onClick={() => setIndex((i) => (i + 1) % ICONS.length)}
    >
      <MorphIcon
        icon={ICONS[index]}
        spring=${JSON.stringify(spring)}
        size={${size}}
        strokeWidth={${stroke}}
        color=${JSON.stringify(color)}
      />
    </button>
  );
}
`
        : `import { useState } from "react";
import { MorphIcon } from "morphicons/react";

${consts}

export function IconMorph() {
  const [on, setOn] = useState(false);
  return (
    <button type="button" onClick={() => setOn((v) => !v)} aria-pressed={on}>
      <MorphIcon
        icon={on ? ${b} : ${a}}
        spring=${JSON.stringify(spring)}
        size={${size}}
        strokeWidth={${stroke}}
        color=${JSON.stringify(color)}
      />
    </button>
  );
}
`;

    case "vue":
      return many
        ? `<script setup>
import { ref } from "vue";
import { MorphIcon } from "morphicons/vue";

${consts}

const ICONS = ${iconList};
const index = ref(0);
</script>

<template>
  <button type="button" @click="index = (index + 1) % ICONS.length">
    <MorphIcon
      :icon="ICONS[index]"
      spring=${JSON.stringify(spring)}
      :size="${size}"
      :stroke-width="${stroke}"
      color=${JSON.stringify(color)}
    />
  </button>
</template>
`
        : `<script setup>
import { ref } from "vue";
import { MorphIcon } from "morphicons/vue";

${consts}

const on = ref(false);
</script>

<template>
  <button type="button" @click="on = !on" :aria-pressed="on">
    <MorphIcon
      :icon="on ? ${b} : ${a}"
      spring=${JSON.stringify(spring)}
      :size="${size}"
      :stroke-width="${stroke}"
      color=${JSON.stringify(color)}
    />
  </button>
</template>
`;

    case "svelte":
      return many
        ? `<script>
  import { MorphIcon } from "morphicons/svelte";

  ${consts.replace(/\n/g, "\n  ")}

  const ICONS = ${iconList};
  let index = $state(0);
</script>

<button type="button" onclick={() => (index = (index + 1) % ICONS.length)}>
  <MorphIcon
    icon={ICONS[index]}
    spring=${JSON.stringify(spring)}
    size={${size}}
    strokeWidth={${stroke}}
    color=${JSON.stringify(color)}
  />
</button>
`
        : `<script>
  import { MorphIcon } from "morphicons/svelte";

  ${consts.replace(/\n/g, "\n  ")}

  let on = $state(false);
</script>

<button type="button" onclick={() => (on = !on)} aria-pressed={on}>
  <MorphIcon
    icon={on ? ${b} : ${a}}
    spring=${JSON.stringify(spring)}
    size={${size}}
    strokeWidth={${stroke}}
    color=${JSON.stringify(color)}
  />
</button>
`;

    case "react-native":
      return many
        ? `import { useState } from "react";
import { Pressable } from "react-native";
import { MorphIcon } from "morphicons/react-native";

${consts}

const ICONS = ${iconList};

export function IconMorph() {
  const [index, setIndex] = useState(0);
  return (
    <Pressable onPress={() => setIndex((i) => (i + 1) % ICONS.length)}>
      <MorphIcon
        icon={ICONS[index]}
        spring=${JSON.stringify(spring)}
        size={${size}}
        strokeWidth={${stroke}}
        color=${JSON.stringify(color)}
      />
    </Pressable>
  );
}
`
        : `import { useState } from "react";
import { Pressable } from "react-native";
import { MorphIcon } from "morphicons/react-native";

${consts}

export function IconMorph() {
  const [on, setOn] = useState(false);
  return (
    <Pressable onPress={() => setOn((v) => !v)}>
      <MorphIcon
        icon={on ? ${b} : ${a}}
        spring=${JSON.stringify(spring)}
        size={${size}}
        strokeWidth={${stroke}}
        color=${JSON.stringify(color)}
      />
    </Pressable>
  );
}
`;

    case "html":
      return `<script type="module">
  import { defineMorphIcon } from "morphicons/element";
  defineMorphIcon();

  ${consts}

  const el = document.querySelector("morph-icon");
  ${
    many
      ? `const ICONS = ${iconList};
  let index = 0;
  el.icon = ICONS[0];
  document.querySelector("button").addEventListener("click", () => {
    index = (index + 1) % ICONS.length;
    el.icon = ICONS[index];
  });`
      : `let on = false;
  el.icon = ${a};
  document.querySelector("button").addEventListener("click", () => {
    on = !on;
    el.icon = on ? ${b} : ${a};
  });`
  }
</script>

<button type="button">
  <morph-icon
    spring="${spring}"
    size="${size}"
    stroke-width="${stroke}"
    color="${color}"
  ></morph-icon>
</button>
`;

    case "vanilla":
      return `import { createMorph } from "morphicons/dom";

${consts}

const path = document.querySelector("#icon");
const morph = createMorph(path, ${a});
${
  many
    ? `const ICONS = ${iconList};
let index = 0;
document.querySelector("button").addEventListener("click", () => {
  index = (index + 1) % ICONS.length;
  morph.morphTo(ICONS[index], ${JSON.stringify(spring)});
});`
    : `let on = false;
document.querySelector("button").addEventListener("click", () => {
  on = !on;
  morph.morphTo(on ? ${b} : ${a}, ${JSON.stringify(spring)});
});`
}

/* SVG
<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none"
     stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
  <path id="icon" d="" />
</svg>
*/
`;

    default:
      return consts;
  }
}
