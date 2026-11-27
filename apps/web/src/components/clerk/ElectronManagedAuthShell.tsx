import { passkeys } from "@clerk/electron/passkeys";
import { ClerkProvider } from "@clerk/electron/react";
import { macDesktopLinkProtocol } from "@t3tools/shared/macDesktopLinks";
import type { ReactNode } from "react";

import { ManagedRelayAuthProvider } from "../../cloud/managedAuth";
import { clerkAppearance } from "./clerkAppearance";

/** Load only lazily inside desktop; clerk-js is statically bundled and would otherwise enter every
 * client's startup graph. */
export default function ElectronManagedAuthShell({
  publishableKey,
  children,
}: {
  readonly publishableKey: string;
  readonly children: ReactNode;
}) {
  const protocol = window.location.protocol;
  const allowedRedirectProtocols =
    window.desktopBridge?.getClientPlatform() === "darwin"
      ? [protocol, macDesktopLinkProtocol(protocol)]
      : undefined;
  return (
    <ClerkProvider
      {...(allowedRedirectProtocols ? { allowedRedirectProtocols } : {})}
      appearance={clerkAppearance}
      publishableKey={publishableKey}
      passkeys={passkeys}
    >
      <ManagedRelayAuthProvider>{children}</ManagedRelayAuthProvider>
    </ClerkProvider>
  );
}
