import type { ReactNode } from "react";

import { requireDeveloperPreviewAccess } from "../developer-access";

export default function BgmPreviewLayout({ children }: { children: ReactNode }) {
  requireDeveloperPreviewAccess();
  return children;
}
