import { type LimitPool } from "@t3tools/shared/usageLimits";
import { T, useGT } from "gt-react";
import { PinIcon, PinOffIcon } from "lucide-react";

import { providerClients } from "../settings/providerDriverMeta";
import { Button } from "../ui/button";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "../ui/menu";
import { Toggle, ToggleGroup } from "../ui/toggle-group";
import {
  sidebarUsagePins,
  sidebarUsageCounters,
  useSidebarUsagePreferences,
} from "./sidebarUsagePreferences";

export function SidebarUsageSettings({ pools }: { readonly pools: readonly LimitPool[] }) {
  const gt = useGT();
  const [preferences, setPreferences] = useSidebarUsagePreferences();
  const counters = sidebarUsageCounters(pools);
  const pins = sidebarUsagePins(counters, preferences);
  const available = pools.filter(
    (pool) => pool.windows.length > 0 && !preferences.providers.includes(pool.driver),
  );
  const shown = pools.filter((pool) => preferences.providers.includes(pool.driver));

  return (
    <section className="flex flex-col gap-3 rounded-xl border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">
          <T>Sidebar counters</T>
        </h2>
        <ToggleGroup
          aria-label={gt("Sidebar usage display")}
          variant="segmented"
          value={[preferences.spent ? "spent" : "remaining"]}
          onValueChange={([mode]) => {
            if (mode) setPreferences((current) => ({ ...current, spent: mode === "spent" }));
          }}
        >
          <Toggle value="remaining">
            <T>Remaining</T>
          </Toggle>
          <Toggle value="spent">
            <T>Spent</T>
          </Toggle>
        </ToggleGroup>
      </div>
      {shown.map(({ driver }) => (
        <div key={driver} className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium">{providerClients.get(driver)?.label ?? driver}</h3>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                const prefix = `[${JSON.stringify(driver)},`;
                setPreferences((current) => ({
                  ...current,
                  providers: current.providers.filter((provider) => provider !== driver),
                  pins: current.pins.filter((id) => !id.startsWith(prefix)),
                  unpinned: current.unpinned.filter((id) => !id.startsWith(prefix)),
                }));
              }}
            >
              <T>Remove</T>
            </Button>
          </div>
          {counters
            .filter((counter) => counter.driver === driver)
            .map(({ id, window }) => {
              const pinned = pins.includes(id);
              return (
                <div key={id} className="flex items-center justify-between gap-2 pl-3">
                  <span className="text-xs text-muted-foreground">{window.label}</span>
                  <Button
                    size="xs"
                    variant={pinned ? "secondary" : "ghost"}
                    aria-pressed={pinned}
                    aria-label={
                      pinned
                        ? gt("Unpin {window}", { window: window.label })
                        : gt("Pin {window}", { window: window.label })
                    }
                    onClick={() =>
                      setPreferences((current) => {
                        const saved = sidebarUsagePins(counters, current);
                        if (saved.includes(id)) {
                          return {
                            ...current,
                            pins: current.pins.filter((key) => key !== id),
                            unpinned: [...new Set([...current.unpinned, id])],
                          };
                        }
                        return {
                          ...current,
                          pins: [...saved, id],
                          unpinned: current.unpinned.filter((key) => key !== id),
                        };
                      })
                    }
                  >
                    {pinned ? <PinOffIcon /> : <PinIcon />}
                  </Button>
                </div>
              );
            })}
        </div>
      ))}
      {available.length > 0 ? (
        <div className="self-start">
          <Menu>
            <MenuTrigger
              render={
                <Button size="xs" variant="outline">
                  <T>Add provider</T>
                </Button>
              }
            />
            <MenuPopup>
              {available.map(({ driver }) => (
                <MenuItem
                  key={driver}
                  onClick={() =>
                    setPreferences((current) => ({
                      ...current,
                      providers: [...new Set([...current.providers, driver])],
                    }))
                  }
                >
                  {providerClients.get(driver)?.label ?? driver}
                </MenuItem>
              ))}
            </MenuPopup>
          </Menu>
        </div>
      ) : null}
    </section>
  );
}
