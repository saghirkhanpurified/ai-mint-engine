import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// IMPORT THE THIRDWEB PROVIDER
import { ThirdwebProvider } from "thirdweb/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Mint Engine",
  description: "Turn ideas into deployed Web3 digital assets in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* WRAP THE APP IN WEB3 CAPABILITIES */}
        <ThirdwebProvider>{children}</ThirdwebProvider>
      </body>
    </html>
  );
}