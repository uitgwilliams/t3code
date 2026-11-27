import { ProviderDriverKind } from "@t3tools/contracts";
import type { LimitPoolWindow } from "@t3tools/shared/usageLimits";
import { expect, it } from "vite-plus/test";

import { sidebarUsageCounters, sidebarUsagePins } from "./sidebarUsagePreferences";

it("keeps saved order and unpins when a provider's weekly quota arrives later", () => {
  const codex = ProviderDriverKind.make("codex");
  const claude = ProviderDriverKind.make("claudeAgent");
  const antigravity = ProviderDriverKind.make("antigravity");
  const window = (id: string, kind: LimitPoolWindow["kind"]): LimitPoolWindow => ({
    id,
    kind,
    label: id,
    members: [],
    columns: [],
    usedPercent: 30,
    remainingPercent: 70,
    pace: null,
    resets: [],
  });
  const counters = sidebarUsageCounters([
    {
      driver: codex,
      accounts: [],
      windows: [window("session", "session"), window("weekly", "weekly")],
    },
    { driver: claude, accounts: [], windows: [window("seven_day", "weekly")] },
    {
      driver: antigravity,
      accounts: [],
      windows: [window("3p-weekly", "weekly"), window("gemini-weekly", "weekly")],
    },
  ]);
  const [codexSession, codexWeekly, claudeWeekly, geminiWeekly] = counters;
  if (!codexSession || !codexWeekly || !claudeWeekly || !geminiWeekly) {
    throw new Error("Expected quota windows for all three providers.");
  }
  const defaults = {
    providers: [codex, claude, antigravity],
    pins: [],
    unpinned: [],
    spent: false,
  };
  expect(sidebarUsagePins(counters, defaults)).toEqual([
    codexWeekly.id,
    claudeWeekly.id,
    geminiWeekly.id,
  ]);
  const edited = {
    ...defaults,
    pins: [claudeWeekly.id, codexSession.id],
    unpinned: [codexWeekly.id],
  };
  expect(sidebarUsagePins(counters, edited)).toEqual([
    claudeWeekly.id,
    codexSession.id,
    geminiWeekly.id,
  ]);
});
