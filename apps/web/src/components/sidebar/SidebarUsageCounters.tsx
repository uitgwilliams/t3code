import { useAtomValue } from "@effect/atom-react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { collectLimitAccounts, collectLimitPools } from "@t3tools/shared/usageLimits";
import { useGT, useLocale } from "gt-react";
import type { ReactNode } from "react";

import { environmentPresentations } from "../../state/presentation";
import { ProviderInstanceIcon } from "../chat/ProviderInstanceIcon";
import { providerClients } from "../settings/providerDriverMeta";
import { SidebarMenuItem } from "../ui/sidebar";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import {
  sidebarUsagePins,
  sidebarUsageCounters,
  useSidebarUsagePreferences,
} from "../usage/sidebarUsagePreferences";

const DRAG_MODIFIERS = [restrictToHorizontalAxis];

function Counter({
  counter,
  spent,
  onClick,
}: {
  readonly counter: ReturnType<typeof sidebarUsageCounters>[number];
  readonly spent: boolean;
  readonly onClick: () => void;
}) {
  const gt = useGT();
  const locale = useLocale();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: counter.id,
  });
  const provider = providerClients.get(counter.driver)?.label ?? counter.driver;
  const percent = new Intl.NumberFormat(locale, { style: "percent" }).format(
    (spent ? counter.window.usedPercent : counter.window.remainingPercent) / 100,
  );
  const label = spent
    ? gt("{provider} · {window} · {percent} spent", {
        provider,
        window: counter.window.label,
        percent,
      })
    : gt("{provider} · {window} · {percent} remaining", {
        provider,
        window: counter.window.label,
        percent,
      });
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            ref={setNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            aria-label={label}
            onClick={onClick}
            style={{
              transform: CSS.Translate.toString(transform),
              transition,
              zIndex: isDragging ? 1 : undefined,
            }}
            className="relative flex h-8 min-w-13 shrink-0 touch-none items-center justify-center gap-1 rounded-md px-1.5 text-xs whitespace-nowrap tabular-nums text-sidebar-foreground hover:bg-sidebar-row-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <ProviderInstanceIcon
              driverKind={counter.driver}
              displayName={provider}
              className="pointer-events-none size-3.5 grayscale"
              iconClassName="size-3.5"
            />
            {percent}
          </button>
        }
      />
      <TooltipPopup side="top">{label}</TooltipPopup>
    </Tooltip>
  );
}

export function SidebarUsageCounters({
  onClick,
  fallback,
}: {
  readonly onClick: () => void;
  readonly fallback: ReactNode;
}) {
  const presentations = useAtomValue(environmentPresentations.presentationsWithProvidersAtom);
  const [preferences, setPreferences] = useSidebarUsagePreferences();
  const accounts = collectLimitAccounts(presentations);
  const checkedAt = accounts.reduce(
    (latest, account) => Math.max(latest, Date.parse(account.limits.checkedAt) || 0),
    0,
  );
  const counters = sidebarUsageCounters(collectLimitPools(accounts, checkedAt));
  const pins = sidebarUsagePins(counters, preferences);
  const byId = new Map(
    counters
      .filter(({ driver }) => preferences.providers.includes(driver))
      .map((counter) => [counter.id, counter]),
  );
  const visiblePins = pins.filter((id) => byId.has(id));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: {
        start: ["Space"],
        end: ["Space"],
        cancel: ["Escape"],
      },
    }),
  );

  if (visiblePins.length === 0) return fallback;
  return (
    <SidebarMenuItem className="min-w-0 flex-1 overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={DRAG_MODIFIERS}
        onDragEnd={({ active, over }) => {
          if (!over || active.id === over.id) return;
          setPreferences((current) => {
            const order = sidebarUsagePins(counters, current);
            const from = order.indexOf(String(active.id));
            const to = order.indexOf(String(over.id));
            return from < 0 || to < 0 ? current : { ...current, pins: arrayMove(order, from, to) };
          });
        }}
      >
        <SortableContext items={visiblePins} strategy={horizontalListSortingStrategy}>
          <div className="flex w-max min-w-full items-center justify-evenly gap-1">
            {visiblePins.map((id) => {
              const counter = byId.get(id);
              return counter ? (
                <Counter key={id} counter={counter} spent={preferences.spent} onClick={onClick} />
              ) : null;
            })}
          </div>
        </SortableContext>
      </DndContext>
    </SidebarMenuItem>
  );
}
