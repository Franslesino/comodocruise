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
  title: "COMODOCRUISE - Explore the Ocean",
  description: "Experience the ultimate sea expedition with ComodoCruise. Discover pristine waters and amazing marine life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Roboto+Condensed:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
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
