import { createFileRoute } from "@tanstack/react-router";

import { UsagePage } from "../components/usage/UsagePage";

export const Route = createFileRoute("/_chat/usage")({
  validateSearch: (search: Record<string, unknown>): { refreshLimits?: true } =>
    search.refreshLimits === true ? { refreshLimits: true } : {},
  component: UsageRoute,
});

function UsageRoute() {
  const { refreshLimits } = Route.useSearch();
  return <UsagePage refreshLimitsOnOpen={refreshLimits === true} />;
}
