import type { Metadata, Viewport } from "next";
import { Geist_Mono, Montserrat, Raleway } from "next/font/google";

import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import { QueryProvider } from "@/lib/query/provider";
import { THEME_SCRIPT } from "@/lib/theme/theme";
import { THEME_COLOR } from "@/lib/pwa/manifest";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Where the site lives, needed to turn the preview image into the absolute URL
 * that WhatsApp and the rest demand. Overridable so a preview deployment does
 * not advertise production's address.
 */
export const metadataBase = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://josema.fholk.com",
);

const DESCRIPTION = "Planes de entrenamiento y dieta";

export const metadata: Metadata = {
  metadataBase,
  title: "JOSEMA RB",
  description: DESCRIPTION,
  appleWebApp: { capable: true, title: "JOSEMA RB", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
  // Without these, a shared link falls back to the favicon and shows whatever
  // tiny icon the chat app can find.
  openGraph: {
    type: "website",
    siteName: "JOSEMA RB",
    title: "JOSEMA RB",
    description: DESCRIPTION,
    locale: "es_ES",
    images: [
      {
        url: "/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: "JOSEMA RB",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JOSEMA RB",
    description: DESCRIPTION,
    images: ["/brand/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      // The script below adds `dark` before React hydrates, and React must not
      // undo it: the alternative is a white flash on every single load.
      suppressHydrationWarning
      className={`${montserrat.variable} ${raleway.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <ServiceWorkerRegistrar />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
