import { BufferPolyfill } from "@/components/BufferPolyfill";
import { AppChrome } from "@/components/shell/AppChrome";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { WalletContextProvider } from "./providers/wallet-providers";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";

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
  openGraph: {
    title: "Cloak Shielded Payroll",
    description:
      "USDC to shielded UTXO recipients on Solana — private payroll, viewing keys for audit.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f0f4ff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ colorScheme: "light" }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        style={{
          /* Fallback if dev CSS chunk fails to load. Full styling still comes from globals.css. */
          background: "linear-gradient(168deg, #f8fafc 0%, #f0f4ff 45%, #e8ecff 100%)",
          color: "#0f172a",
          minHeight: "100vh",
        }}
      >
        <WalletContextProvider>
          <BufferPolyfill />
          <AppChrome>{children}</AppChrome>
        </WalletContextProvider>
      </body>
    </html>
  );
}
