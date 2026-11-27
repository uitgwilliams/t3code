import { userEvent } from "vite-plus/test/browser";
import { expect, it, vi } from "vite-plus/test";

import { render } from "../../../test/render";
import { SidebarUsageCounters } from "./SidebarUsageCounters";

vi.mock("../../state/presentation", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../state/presentation")>();
  const { Atom } = await import("effect/reactivity");
  const checkedAt = "2026-11-27T16:00:00Z";
  return {
    ...original,
    environmentPresentations: {
      ...original.environmentPresentations,
      presentationsWithProvidersAtom: Atom.make(
        new Map([
          [
            "test",
            {
              entry: { target: { label: "Test" } },
              serverConfig: {
                providers: [
                  { driver: "codex", usedPercent: 32 },
                  { driver: "claudeAgent", usedPercent: 59 },
                  { driver: "antigravity", usedPercent: 43 },
                ].map(({ driver, usedPercent }) => ({
                  instanceId: driver,
                  driver,
                  enabled: true,
                  installed: true,
                  status: "ready",
                  auth: { status: "authenticated" },
                  usageLimits: {
                    checkedAt,
                    windows: [{ id: "weekly", label: "Weekly", kind: "weekly", usedPercent }],
                  },
                })),
              },
            },
          ],
        ]),
      ),
    },
  };
});

it("saves the reordered usage counters and still opens Usage on click", async () => {
  const key = "t3code:sidebar-usage:v1";
  const initial = localStorage.getItem(key);
  using _storage = {
    [Symbol.dispose]() {
      if (initial === null) localStorage.removeItem(key);
      else localStorage.setItem(key, initial);
    },
  };
  localStorage.removeItem(key);
  const onClick = vi.fn();
  await using screen = await render(
    <ul>
      <SidebarUsageCounters onClick={onClick} fallback={null} />
    </ul>,
  );

  const codex = screen.getByRole("button", { name: /Codex.*Weekly.*68% remaining/ });
  codex.element().focus();
  await userEvent.keyboard(" ");
  await userEvent.keyboard("{ArrowRight}");
  await userEvent.keyboard(" ");
  await expect.element(screen.getByRole("button").first()).toHaveTextContent("41%");
  expect(onClick).not.toHaveBeenCalled();

  await codex.click();
  expect(onClick).toHaveBeenCalledOnce();
});
