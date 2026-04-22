import { BufferPolyfill } from "@/components/BufferPolyfill";
import { AppChrome } from "@/components/shell/AppChrome";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { WalletContextProvider } from "./providers/wallet-providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.VERCEL_URL != null
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Cloak Shielded Payroll",
  description:
    "Run USDC payroll to shielded UTXO recipients on Solana with Cloak — private, auditable through viewing keys.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans`}
      >
        <WalletContextProvider>
          <BufferPolyfill />
          <AppChrome>{children}</AppChrome>
        </WalletContextProvider>
      </body>
    </html>
  );
}
