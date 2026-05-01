import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://msi-quote-studio.vercel.app";
const DESCRIPTION =
  "AI-enhanced quote estimator for custom manufacturing — complexity scoring, price recommendations, and rule-based estimating in one workflow.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MSI Quote Studio",
    template: "%s · MSI Quote Studio",
  },
  description: DESCRIPTION,
  keywords: [
    "quote estimator",
    "custom manufacturing",
    "AI complexity scoring",
    "Marking Systems",
    "label estimating",
    "Next.js",
    "portfolio case study",
  ],
  authors: [{ name: "Samuel Muriuki" }],
  creator: "Samuel Muriuki",
  openGraph: {
    type: "website",
    siteName: "MSI Quote Studio",
    title: "MSI Quote Studio — AI-enhanced quote estimating",
    description: DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "MSI Quote Studio — AI-enhanced quote estimating",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
