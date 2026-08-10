import "server-only";

import { notFound } from "next/navigation";

export function developerPreviewsAvailable() {
  return process.env.NODE_ENV === "development";
}

export function requireDeveloperPreviewAccess() {
  if (!developerPreviewsAvailable()) notFound();
}
