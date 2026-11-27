// Keep the renderer origin compatible with upstream servers and existing browser storage.
// Only macOS launch links use the fork's schemes.
const schemes = [
  ["t3code:", "g3code:"],
  ["t3code-dev:", "g3code-dev:"],
] as const;

export function macDesktopLinkProtocol(rendererProtocol: string): string {
  return schemes.find(([internal]) => internal === rendererProtocol)?.[1] ?? rendererProtocol;
}

export function macDesktopLaunchUrl(value: string, rendererProtocol: string): string {
  const external = macDesktopLinkProtocol(rendererProtocol);
  return value.slice(0, external.length + 2).toLowerCase() === `${external}//`
    ? rendererProtocol + value.slice(external.length)
    : value;
}
