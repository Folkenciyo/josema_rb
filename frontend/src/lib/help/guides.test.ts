import fs from "node:fs";
import path from "node:path";

import { HELP_GUIDES, findGuide, guideHref, guideNeighbours } from "./guides";
import { GUIDE_BODIES } from "@/components/help/guides";
import { NAV_GROUPS } from "@/components/layout/nav-items";

const APP_DIR = path.join(process.cwd(), "src", "app");
const GUIDES_DIR = path.join(process.cwd(), "src", "components", "help", "guides");

/** Routes the app really serves, read off the file system. */
function realRoutes(): string[] {
  const routes: string[] = [];

  const walk = (dir: string, url: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      // Route groups like (dashboard) do not show up in the URL.
      const segment = entry.name.startsWith("(") ? "" : `/${entry.name}`;
      const child = path.join(dir, entry.name);
      if (fs.existsSync(path.join(child, "page.tsx"))) {
        routes.push(`${url}${segment}` || "/");
      }
      walk(child, `${url}${segment}`);
    }
  };

  walk(APP_DIR, "");
  return routes;
}

/** Every href written inside the guides, deep links included. */
function hrefsInGuides(): { file: string; href: string }[] {
  return fs
    .readdirSync(GUIDES_DIR)
    .filter((name) => name.endsWith(".tsx"))
    .flatMap((name) => {
      const source = fs.readFileSync(path.join(GUIDES_DIR, name), "utf8");
      return [...source.matchAll(/href="(\/[^"]*)"/g)].map((match) => ({
        file: name,
        href: match[1],
      }));
    });
}

describe("help guides", () => {
  it("has a unique slug per guide", () => {
    const slugs = HELP_GUIDES.map((guide) => guide.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has a body for every guide, and no orphan bodies", () => {
    expect(Object.keys(GUIDE_BODIES).sort()).toEqual(
      HELP_GUIDES.map((guide) => guide.slug).sort(),
    );
  });

  it("only points at screens that exist", () => {
    const routes = realRoutes();
    const guideSlugs = HELP_GUIDES.map((guide) => guideHref(guide.slug));

    // A guide that links nowhere is worse than one that says nothing, and a
    // renamed route would otherwise rot here unnoticed.
    const broken = hrefsInGuides().filter(
      ({ href }) => !guideSlugs.includes(href) && !routes.includes(href),
    );

    expect(broken).toEqual([]);
  });

  it("lists screens that exist in the index too", () => {
    const routes = realRoutes();

    for (const guide of HELP_GUIDES) {
      for (const screen of guide.screens) {
        expect(routes).toContain(screen.href);
      }
    }
  });

  it("is reachable from the menu", () => {
    const hrefs = NAV_GROUPS.flatMap((group) =>
      group.items.map((item) => item.href),
    );

    expect(hrefs).toContain("/ayuda");
  });

  it("chains every guide to its neighbours", () => {
    const first = guideNeighbours(HELP_GUIDES[0].slug);
    const last = guideNeighbours(HELP_GUIDES[HELP_GUIDES.length - 1].slug);
    const middle = guideNeighbours(HELP_GUIDES[1].slug);

    expect(first.previous).toBeNull();
    expect(first.next?.slug).toBe(HELP_GUIDES[1].slug);
    expect(last.next).toBeNull();
    expect(middle.previous?.slug).toBe(HELP_GUIDES[0].slug);
  });

  it("does not resolve a slug that is not in the manual", () => {
    expect(findGuide("no-existe")).toBeUndefined();
  });
});
