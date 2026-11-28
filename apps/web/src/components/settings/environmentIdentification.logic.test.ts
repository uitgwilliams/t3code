import { DEFAULT_ENVIRONMENT_IDENTIFICATION_MODE } from "@t3tools/contracts/settings";
import { expect, it } from "vite-plus/test";

import { resolveEnvironmentIdentificationSelection } from "./environmentIdentification.logic";

it.each(["artwork", "none"] as const)(
  "treats saved %s as the default selection only on Latest",
  (mode) => {
    expect(resolveEnvironmentIdentificationSelection(mode, null)).toBe(
      DEFAULT_ENVIRONMENT_IDENTIFICATION_MODE,
    );
    expect(resolveEnvironmentIdentificationSelection(mode, "dev")).toBe(mode);
    expect(resolveEnvironmentIdentificationSelection(mode, "nightly")).toBe(mode);
  },
);

it.each(["dev-artwork", "nightly-artwork"] as const)(
  "keeps explicit %s selected on Latest so it can be reset",
  (mode) => {
    expect(resolveEnvironmentIdentificationSelection(mode, null)).toBe(mode);
  },
);
