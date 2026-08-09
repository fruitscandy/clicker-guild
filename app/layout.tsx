import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import WeaponAttackAudio from "./WeaponAttackAudio";

const title = "모험가 길드 | 길드마스터 클리커 RPG";
const description = "길드원을 뽑고 편성해 몬스터 군세를 정복하는 웹 클리커 RPG";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const socialImage = `${origin}/og.png`;

  return {
    metadataBase: new URL(origin),
    title,
    description,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title,
      description,
      url: origin,
      siteName: "모험가 길드",
      locale: "ko_KR",
      type: "website",
      images: [{ url: socialImage, width: 1672, height: 941, alt: "여관에서 등급별 길드원 계약 카드를 영입하는 모험가 길드" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <WeaponAttackAudio />
        {children}
      </body>
    </html>
  );
}
