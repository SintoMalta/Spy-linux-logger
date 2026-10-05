import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { OfflineBanner } from "@/components/offline-banner";
import { ServiceWorkerRegister } from "@/components/sw-register";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "CoopLaunch Malta",
  description:
    "Evidence-led 12-week cooperative founding programme for Malta",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "CoopLaunch",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f4c3a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} antialiased`}>
        <OfflineBanner />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
