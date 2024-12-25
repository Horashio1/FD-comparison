import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer'; // Import Footer component

export const metadata: Metadata = {
  title: "Best Rates in Sri Lanka",
  description: "Compare banking rates in Sri Lanka",
  openGraph: {
    title: "BestRates.lk",
    description: "Compare Banking Rates and Card Deals in Sri Lanka",
    url: "https://www.bestrates.lk",
    siteName: "BestRates",
    images: [
      {
        url: "https://kbcaevsuxnajykrzhjco.supabase.co/storage/v1/object/public/marketing/cards/haresha_credit_card_promotions_--v_6.1_dec98e47-898b-4e82-919c-013f9b7aad1e_3.png",
        width: 630,
        height: 630,
        alt: "Logo or description of the image",
      },
    ],
    type: "website",
  },
  // Twitter tags are optional, but they don't hurt:
  twitter: {
    card: "summary_large_image",
    title: "BestRates.lk",
    description: "Compare Banking Rates and Card Deals in Sri Lanka",
    images: ["https://kbcaevsuxnajykrzhjco.supabase.co/storage/v1/object/public/marketing/cards/haresha_credit_card_promotions_--v_6.1_dec98e47-898b-4e82-919c-013f9b7aad1e_3.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Best Rates</title>
        <link rel="icon" href="/favicon.ico" /> {/* Adjust to match your favicon's file type */}
      </head>
      <body className="flex flex-col min-h-screen">
        <NavBar /> {/* NavBar will now be globally available across pages */}
        <main className="flex-grow">{children}</main> {/* Page-specific content */}
        <Footer /> {/* Footer will now be globally available across pages */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
