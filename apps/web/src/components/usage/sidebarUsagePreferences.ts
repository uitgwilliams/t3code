import { ProviderDriverKind } from "@t3tools/contracts";
import { displayLimitWindows, type LimitPool } from "@t3tools/shared/usageLimits";
import * as Schema from "effect/Schema";

import { useLocalStorage } from "../../hooks/useLocalStorage";

const Preferences = Schema.Struct({
  providers: Schema.Array(ProviderDriverKind),
  pins: Schema.Array(Schema.String),
  unpinned: Schema.Array(Schema.String),
  spent: Schema.Boolean,
});

const defaults: typeof Preferences.Type = {
  providers: ["codex", "claudeAgent", "antigravity"].map((driver) =>
    ProviderDriverKind.make(driver),
  ),
  pins: [],
  unpinned: [],
  spent: false,
};

export function useSidebarUsagePreferences() {
  return useLocalStorage("t3code:sidebar-usage:v1", defaults, Preferences);
}

export function sidebarUsageCounters(pools: readonly LimitPool[]) {
  return pools.flatMap((pool) =>
    displayLimitWindows(pool).map((window) => ({
      id: JSON.stringify([pool.driver, window.kind, window.id]),
      driver: pool.driver,
      window,
    })),
  );
}

export function sidebarUsagePins(
  counters: ReturnType<typeof sidebarUsageCounters>,
  preferences: typeof Preferences.Type,
) {
  const implicit = preferences.providers.flatMap((driver) => {
    const windows = counters.filter((counter) => counter.driver === driver);
    const first = windows.find(({ window }) => window.kind === "weekly") ?? windows[0];
    return first && !preferences.unpinned.includes(first.id) ? [first.id] : [];
  });
  return [...new Set([...preferences.pins, ...implicit])];
}
