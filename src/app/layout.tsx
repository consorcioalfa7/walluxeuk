import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/lib/i18n/context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1a1a1a",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://walluxe.xdeals.online"),
  title: {
    default: "Walluxe — Premium Acoustic Wood Panels",
    template: "%s | Walluxe",
  },
  description:
    "Luxury decorative acoustic panels and slatted wood wall panels. Modern design meets efficient sound insulation. Free shipping across Europe. Shop now at Walluxe.",
  keywords: [
    "Walluxe",
    "acoustic panels",
    "wood panels",
    "wall panels",
    "decorative panels",
    "sound insulation",
    "slatted panels",
    "wooden wall panels",
    "interior design",
    "home improvement",
    "acoustic insulation",
  ],
  authors: [{ name: "Walluxe", url: "https://walluxe.xdeals.online" }],
  creator: "Walluxe",
  publisher: "Walluxe",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "pt_PT",
    alternateLocale: ["en_GB", "es_ES", "fr_FR", "de_DE", "it_IT"],
    url: "https://walluxe.xdeals.online",
    siteName: "Walluxe",
    title: "Walluxe — Premium Acoustic Wood Panels",
    description:
      "Luxury decorative acoustic panels and slatted wood wall panels. Free shipping across Europe.",
    images: [
      {
        url: "/images/img1.png",
        width: 1200,
        height: 1200,
        alt: "Walluxe Acoustic Wood Panel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Walluxe — Premium Acoustic Wood Panels",
    description:
      "Luxury decorative acoustic panels. Free shipping across Europe.",
    images: ["/images/img1.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <head>
        <link rel="canonical" href="https://walluxe.xdeals.online" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <I18nProvider>{children}</I18nProvider>
        <Toaster />
      </body>
    </html>
  );
}
