import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer'; // Import Footer component

export const metadata: Metadata = {
  title: "Best Rates Sri Lanka",
  description: "Compare financial rates in Sri Lanka",
  openGraph: {
    title: "BestRates.lk",
    description: "Get the latest Bank Card Promos and Banking rates",
    url: "https://www.bestrates.lk",
    siteName: "BestRates",
    images: [
      {
        url: "https://res.cloudinary.com/ddqtjwpob/image/upload/v1735158039/cards_swzbkd.jpg",
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
    images: ["https://res.cloudinary.com/ddqtjwpob/image/upload/v1735158039/cards_swzbkd.jpg"],
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
