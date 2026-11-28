import { expect, it } from "vite-plus/test";
import { cdp } from "vite-plus/test/browser";

import "./index.css";

it("limits macOS glass to the app sidebar and honors reduced transparency", async () => {
  const root = document.documentElement;
  const workspace = document.createElement("div");
  workspace.innerHTML = `
    <div data-app-sidebar>
      <div data-slot="sidebar-inner" class="sidebar-glass"><span>Threads</span></div>
    </div>
    <main data-slot="sidebar-inset" class="bg-background surface-grain"></main>
    <div class="sidebar-glass" data-auxiliary-sidebar></div>
  `;
  document.body.append(workspace);
  const appSidebar = workspace.querySelector<HTMLElement>("[data-app-sidebar]")!;
  const sidebar = workspace.querySelector('[data-slot="sidebar-inner"]')!;
  const inset = workspace.querySelector("main")!;
  const auxiliarySidebar = workspace.querySelector("[data-auxiliary-sidebar]")!;
  const styles = [root, document.body].map((element) => [element, element.style.cssText] as const);
  const solidCanvas = "rgb(250, 250, 250)";
  const solidSidebar = "rgb(51, 51, 51)";
  const transparent = "rgba(0, 0, 0, 0)";
  const session = cdp();
  const setTransparency = (value: string) =>
    session.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-transparency", value }],
    });

  try {
    await setTransparency("no-preference");
    root.style.setProperty("--sidebar", solidSidebar);
    appSidebar.style.setProperty("--sidebar", solidSidebar);
    root.style.setProperty("--app-chrome-background", solidCanvas);
    for (const [element] of styles) element.style.backgroundColor = solidCanvas;

    expect(getComputedStyle(sidebar).backgroundColor).toBe(solidSidebar);
    expect(getComputedStyle(root).backgroundColor).toBe(solidCanvas);

    root.dataset.desktopGlass = "macos";
    expect(getComputedStyle(root).backgroundColor).toBe(transparent);
    expect(getComputedStyle(document.body).backgroundColor).toBe(transparent);
    expect(getComputedStyle(document.body).backgroundImage).toBe("none");
    expect(getComputedStyle(inset).backgroundColor).toBe(solidCanvas);
    expect(getComputedStyle(inset).backgroundImage).not.toBe("none");
    expect(getComputedStyle(auxiliarySidebar).backgroundColor).toBe(solidSidebar);
    expect(getComputedStyle(sidebar).backgroundImage).toBe("none");
    expect(getComputedStyle(sidebar).opacity).toBe("1");
    expect(getComputedStyle(sidebar).backgroundColor).toBe("color(srgb 0.2 0.2 0.2 / 0.95)");

    for (const opacity of [40, 100]) {
      root.style.setProperty("--glass-opacity", `${opacity}%`);
      expect(getComputedStyle(sidebar).backgroundColor).toBe(
        opacity === 100 ? "color(srgb 0.2 0.2 0.2)" : "color(srgb 0.2 0.2 0.2 / 0.4)",
      );
    }

    root.style.setProperty("--glass-opacity", "40%");
    await setTransparency("reduce");
    expect(getComputedStyle(sidebar).backgroundColor).toBe(solidSidebar);
    expect(getComputedStyle(root).backgroundColor).toBe(solidCanvas);
    expect(getComputedStyle(document.body).backgroundColor).toBe(solidCanvas);
  } finally {
    delete root.dataset.desktopGlass;
    for (const [element, cssText] of styles) element.style.cssText = cssText;
    workspace.remove();
    await session.send("Emulation.setEmulatedMedia", { features: [] });
  }
});
