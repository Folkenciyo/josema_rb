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

export const metadata: Metadata = {
  title: "JOSEMA RB",
  description: "Planes de entrenamiento y dieta",
  appleWebApp: { capable: true, title: "JOSEMA RB", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
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
