import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "모험가 길드 | 길드마스터 클리커 RPG",
  description: "길드원을 고용하고 편성해 100개 스테이지를 정복하는 웹 클리커 RPG",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
