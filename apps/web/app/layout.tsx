import type { Metadata } from "next";
import {
  EB_Garamond,
  Geist_Mono,
  Open_Sans,
  Source_Sans_3,
} from "next/font/google";
import "./globals.css";
import { SkipLink } from "@/components/SkipLink";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans-3",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Forest City Worlds",
  description:
    "Autonomously learned behaviors. Cognitive models, cortical column, networked world models, while protecting data privacy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${ebGaramond.variable} ${openSans.variable} ${geistMono.variable} ${sourceSans3.variable}`}
    >
      <body className="font-sans antialiased">
        <SkipLink />
        <WebVitalsReporter />
        {children}
      </body>
    </html>
  );
}
