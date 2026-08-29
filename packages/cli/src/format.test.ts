import { describe, expect, test } from "bun:test";
import { aliasIconId, aliasIconName } from "./aliases.ts";
import { compactSvg, formatIcon, wrapSvg } from "./format.ts";

const messy = `<svg
xmlns="http://www.w3.org/2000/svg"
width="24"
height="24"
>
<path d="M1 1" />
</svg>`;

describe("aliases", () => {
  test("renames lucide filter and more-horizontal", () => {
    expect(aliasIconName("filter")).toBe("list-filter");
    expect(aliasIconId("lucide:more-horizontal")).toBe("lucide:ellipsis");
    expect(aliasIconId("lucide:house")).toBe("lucide:house");
  });
});

describe("formatIcon", () => {
  test("compacts svg and pretty-wraps react", () => {
    expect(compactSvg(messy)).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M1 1" /></svg>',
    );
    const react = formatIcon(messy, "house", "react", "lucide:house");
    expect(react).toContain("<svg {...props}");
    expect(react).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(react).not.toContain("<svg {...props}\nxmlns");
  });

  test("wraps vue and svelte attrs", () => {
    expect(wrapSvg(messy, ' v-bind="$attrs"')).toContain('v-bind="$attrs"');
    expect(formatIcon(messy, "house", "vue", "lucide:house")).toContain("v-bind");
    expect(formatIcon(messy, "house", "svelte", "lucide:house")).toContain("{...props}");
  });
});
