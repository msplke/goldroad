import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "~/styles/globals.css";

import { TailwindIndicator } from "~/app/_components/tailwind-indicator";
import { ThemeProvider } from "~/app/_components/theme-provider";
import { cn, constructMetadata } from "~/lib/utils";
import { TRPCReactProvider } from "~/trpc/react";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = constructMetadata();

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background min-h-screen font-sans antialiased",
          fontSans.variable,
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TRPCReactProvider>{children}</TRPCReactProvider>

          <TailwindIndicator />
        </ThemeProvider>
      </body>
    </html>
  );
}
