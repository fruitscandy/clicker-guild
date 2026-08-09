import type { Metadata } from "next";
import BgmPreview from "./BgmPreview";

export const metadata: Metadata = {
  title: "Clicker Guild Original Soundtrack",
  description: "길드 관리, 필드 선택, 일반 전투, 보스 전투 BGM 미리듣기",
};

export default function BgmPreviewPage() {
  return <BgmPreview />;
}
