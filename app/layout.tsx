import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteEffects } from "@/components/ui/site-effects";
import { ToastProvider } from "@/components/ui/toast-provider";
import "./globals.css";

const pricedown = localFont({
  src: "../public/assets/fonts/Pricedown Bl.otf",
  variable: "--font-display",
  display: "swap",
});

const chalet = localFont({
  src: "../public/assets/fonts/ChaletComprime CologneSixty.otf",
  variable: "--font-body",
  display: "swap",
});

const forresten = localFont({
  src: "../public/assets/fonts/Forresten.otf",
  variable: "--font-accent",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Code Theft Arena",
  description: "Cyberpunk coding challenge arena",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${pricedown.variable} ${chalet.variable} ${forresten.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-fuchsia-400/40">
        <ToastProvider>
          <SiteEffects />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
