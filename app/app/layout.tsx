import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import {
  ClerkProvider
} from '@clerk/nextjs'
import { Toaster } from "@/components/ui/toaster"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Probso - Transform PDFs into Educational Videos",
  description:
    "Convert your PDF textbooks and documents into engaging video explanations. Learn faster with AI-powered video tutorials.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon.ico",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/probso-logo-icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/probso-logo-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`font-sans antialiased`}>
          {children}
          <Analytics />
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
