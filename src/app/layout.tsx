import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cantoFont, avenirFont } from "./fonts";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KOMODOCRUISES - Explore the Ocean",
  description: "Experience the ultimate sea expedition with KOMODOCRUISES. Discover pristine waters and amazing marine life.",
  icons: {
    icon: "/logo1.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
        {/* Google Fonts preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Roboto+Condensed:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
        {/* Google Drive image CDN preconnect — reduces first-image latency */}
        <link rel="preconnect" href="https://drive.google.com" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://drive.google.com" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
      </head>
      <body
        className={[
          geistSans.variable,
          geistMono.variable,
          cantoFont.variable,
          avenirFont.variable,
          "antialiased"
        ].filter(Boolean).join(" ")}
      >
        {children}
      </body>
    </html>
  );
}
