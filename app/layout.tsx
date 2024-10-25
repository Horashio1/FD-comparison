import type { Metadata } from "next";
// import localFont from "next/font/local";
// import { Inter } from 'next/font/google'
import "./globals.css";
import { Analytics } from '@vercel/analytics/react';
import NavBar from '../components/NavBar';

// const inter = Inter({ subsets: ['latin'] })


export const metadata: Metadata = {
  title: 'Fixed Deposit Comparison',
  description: 'Compare fixed deposit rates across Sri Lankan banks',
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Best Rates</title>
        <link rel="icon" href="/favicon.ico" /> {/* Adjust to match your favicon's file type */}
      </head>
      <body>
        <NavBar /> {/* NavBar will now be globally available across pages */}
        <main>{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
