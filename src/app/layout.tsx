import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "NVIT.SPACE - Admin Portal",
    template: "NVIT.SPACE - %s",
  },
  description: "Enterprise Operations Overview",
};

import AuthGuard from "@/components/AuthGuard";
import QueryProvider from "@/providers/QueryProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <QueryProvider>
          <AuthGuard>{children}</AuthGuard>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
