import type { EnvironmentIdentificationMode } from "@t3tools/contracts/settings";
import type { SidebarStageBackdropVariant } from "../SidebarStageBackdrop";

export function resolveEnvironmentIdentificationSelection(
  savedMode: EnvironmentIdentificationMode,
  stageVariant: SidebarStageBackdropVariant | null,
): EnvironmentIdentificationMode {
  return stageVariant === null && (savedMode === "artwork" || savedMode === "none")
    ? "pill"
    : savedMode;
}
