import type { ReactNode } from "react";

import { requireDeveloperPreviewAccess } from "../../developer-access";

export default function EndingPreviewLayout({ children }: { children: ReactNode }) {
  requireDeveloperPreviewAccess();
  return children;
}
