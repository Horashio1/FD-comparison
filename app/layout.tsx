import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer'; // Import Footer component

export const metadata: Metadata = {
  title: 'Best Rates in Sri Lanka',
  description: 'Compare banking rates in Sri Lanka',
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
