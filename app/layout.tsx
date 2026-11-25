import type { Metadata, Viewport } from "next";
// Self-hosted fonts (no request to Google at runtime, no layout shift).
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/400-italic.css";
import "@fontsource/barlow/500.css";
import "@fontsource/noto-kufi-arabic/700.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://sabaku.ae"),
  title: "Sabaku — Japanese café in Aljada, Sharjah",
  description:
    "Soufflé pancakes, Sabaku Matcha, sencha and slow coffee behind the noren. Aljada, Boulevard 3 — South Avenue, Sharjah.",
  openGraph: {
    title: "Sabaku — Aljada, Sharjah",
    description: "Step behind the noren: soufflé pancakes, matcha and slow coffee.",
    images: ["/media/film2/hd/f_000.webp"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#141210",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Warm up the first film frame before React hydrates (same rules as pickFrameSet). */}
        <link rel="preload" as="image" href="/media/film2/m/f_000.webp" media="(max-aspect-ratio: 4/5)" />
        <link rel="preload" as="image" href="/media/film2/sd/f_000.webp" media="(min-aspect-ratio: 4/5) and (max-width: 1799px)" />
        <link rel="preload" as="image" href="/media/film2/hd/f_000.webp" media="(min-aspect-ratio: 4/5) and (min-width: 1800px)" />
      </head>
      <body>{children}</body>
    </html>
  );
}
