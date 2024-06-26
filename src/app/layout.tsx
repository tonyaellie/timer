import "~/styles/globals.css";

import { Inter } from "next/font/google";
import { ClerkProvider, UserButton } from "@clerk/nextjs";

import { TRPCReactProvider } from "~/trpc/react";
import Link from "next/link";
import { dark } from "@clerk/themes";
import { Toaster } from "~/components/ui/sonner";
import { SWInstaller } from "~/components/swInstaller";
import { type Metadata } from "next";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Shared Timer",
  description: "A synchronized timer for groups!",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
} satisfies Metadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    <ClerkProvider appearance={dark as any}>
      <html lang="en">
        <body className={`font-sans ${inter.variable}`}>
          <Script
            defer
            data-domain="timer.tokia.dev"
            src="https://ingest.tokia.dev/js/script.js"
          />
          <TRPCReactProvider>
            <Toaster />
            <SWInstaller />
            <div className="m-2 flex flex-row">
              <Link href="/" className="my-auto text-lg font-bold text-primary">
                Shared Timer
              </Link>
              <div className="flex-grow" />
              <UserButton />
            </div>
            {children}
          </TRPCReactProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

export const runtime = "edge";
