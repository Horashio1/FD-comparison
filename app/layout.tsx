import type { Metadata } from "next";
// import localFont from "next/font/local";
import { Inter } from 'next/font/google'
import "./globals.css";
import { Analytics } from '@vercel/analytics/react';


const inter = Inter({ subsets: ['latin'] })


export const metadata: Metadata = {
  title: 'Fixed Deposit Comparison',
  description: 'Compare fixed deposit rates across Sri Lankan banks',
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}<Analytics /></body>
    </html>
  )
}
