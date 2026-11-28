import { expect, it } from "vite-plus/test";
import { cdp } from "vite-plus/test/browser";

import "./index.css";

it("limits macOS glass to the app sidebar and honors reduced transparency", async () => {
  const root = document.documentElement;
  const workspace = document.createElement("div");
  workspace.innerHTML = `
    <div data-app-sidebar>
      <div data-slot="sidebar-inner" class="sidebar-glass">
        <div class="sidebar-stage-backdrop"></div>
        <span>Threads</span>
      </div>
    </div>
    <main data-slot="sidebar-inset" class="bg-background surface-grain"></main>
    <div class="sidebar-glass" data-auxiliary-sidebar></div>
  `;
  document.body.append(workspace);
  const appSidebar = workspace.querySelector<HTMLElement>("[data-app-sidebar]")!;
  const sidebar = workspace.querySelector('[data-slot="sidebar-inner"]')!;
  const backdrop = workspace.querySelector(".sidebar-stage-backdrop")!;
  const inset = workspace.querySelector("main")!;
  const auxiliarySidebar = workspace.querySelector("[data-auxiliary-sidebar]")!;
  const styles = [root, document.body].map((element) => [element, element.style.cssText] as const);
  const customChrome = "oklch(0.2 0 0 / 0.5)";
  const customSidebar = "rgba(51, 51, 51, 0.5)";
  const solidSidebar = "color(srgb 0.2 0.2 0.2)";
  const transparent = "rgba(0, 0, 0, 0)";
  const session = cdp();
  const setTransparency = (value: string) =>
    session.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-transparency", value }],
    });
  const expectOpaqueCanvas = () => {
    for (const [scheme, background] of [
      ["light", "rgb(255, 255, 255)"],
      ["dark", "rgb(0, 0, 0)"],
    ] as const) {
      root.style.colorScheme = scheme;
      expect(getComputedStyle(root).backgroundColor).toBe(background);
      expect(getComputedStyle(document.body).backgroundColor).toBe(customChrome);
      expect(document.body.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(
        window.innerHeight,
      );
    }
  };

  try {
    await setTransparency("no-preference");
    root.style.setProperty("--sidebar", customSidebar);
    appSidebar.style.setProperty("--sidebar", customSidebar);
    for (const [element] of styles) element.style.backgroundColor = customChrome;

    expect(getComputedStyle(sidebar).backgroundColor).toBe(solidSidebar);
    expect(getComputedStyle(root).backgroundColor).toBe(customChrome);

    inset.remove();
    root.dataset.desktopGlass = "macos";
    expectOpaqueCanvas();

    workspace.append(inset);

    for (const scheme of ["dark", "light"]) {
      root.style.colorScheme = scheme;
      for (const [element] of styles) {
        expect(getComputedStyle(element).backgroundColor).toBe(transparent);
        expect(getComputedStyle(element).backgroundImage).toBe("none");
      }
    }
    root.style.setProperty("--background", "#f8fbff");
    root.style.setProperty("--app-chrome-background", "#101827");
    expect(getComputedStyle(inset).backgroundImage).toMatch(
      /, linear-gradient\(rgb\(248, 251, 255\), rgb\(248, 251, 255\)\), linear-gradient\(rgb\(16, 24, 39\), rgb\(16, 24, 39\)\)$/,
    );
    expect(getComputedStyle(inset).backgroundColor).toBe("rgb(255, 255, 255)");

    root.style.setProperty("--background", "rgba(248, 251, 255, 0.5)");
    root.style.setProperty("--app-chrome-background", "rgba(16, 24, 39, 0.5)");
    for (const [scheme, backing] of [
      ["light", "rgb(255, 255, 255)"],
      ["dark", "rgb(0, 0, 0)"],
    ] as const) {
      root.style.colorScheme = scheme;
      expect(getComputedStyle(inset).backgroundImage).toMatch(
        /, linear-gradient\(rgba\(248, 251, 255, 0.5\), rgba\(248, 251, 255, 0.5\)\), linear-gradient\(rgba\(16, 24, 39, 0.5\), rgba\(16, 24, 39, 0.5\)\)$/,
      );
      expect(getComputedStyle(inset).backgroundColor).toBe(backing);
    }
    expect(getComputedStyle(auxiliarySidebar).backgroundColor).toBe(solidSidebar);
    expect(getComputedStyle(sidebar).backgroundImage).toBe("none");
    expect(getComputedStyle(sidebar).opacity).toBe("1");
    expect(getComputedStyle(sidebar).backgroundColor).toBe("color(srgb 0.2 0.2 0.2 / 0.95)");

    expect(getComputedStyle(backdrop).opacity).toBe("0.95");
    expect(getComputedStyle(backdrop, "::after").display).toBe("none");

    for (const opacity of [40, 100]) {
      root.style.setProperty("--glass-opacity", `${opacity}%`);
      expect(getComputedStyle(sidebar).backgroundColor).toBe(
        opacity === 100 ? "color(srgb 0.2 0.2 0.2)" : "color(srgb 0.2 0.2 0.2 / 0.4)",
      );
      expect(getComputedStyle(backdrop).opacity).toBe(String(opacity / 100));
    }

    root.style.setProperty("--glass-opacity", "40%");
    await setTransparency("reduce");
    expect(getComputedStyle(backdrop).opacity).toBe("1");
    expect(getComputedStyle(backdrop, "::after").display).toBe("block");
    expect(getComputedStyle(sidebar).backgroundColor).toBe(solidSidebar);
    expectOpaqueCanvas();
  } finally {
    delete root.dataset.desktopGlass;
    for (const [element, cssText] of styles) element.style.cssText = cssText;
    workspace.remove();
    await session.send("Emulation.setEmulatedMedia", { features: [] });
  }
});
