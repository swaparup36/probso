"use client"

import Link from "next/link"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { usePathname } from "next/navigation"

interface HeaderProps {
  showBack?: boolean
  backHref?: string
}

export function Header({ showBack = false, backHref = "/" }: HeaderProps) {
  const pathname = usePathname()

  return (
    <header className="border-b border-border bg-black/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex justify-start">
          <Logo />
        </div>

        <nav className="flex items-center gap-7">
          {showBack ? (
            <Button
              variant="ghost"
              asChild
              className="eyebrow text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
              <Link href={backHref} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Link>
            </Button>
          ) : (
            <>
              <Link
                href="/about"
                className={`eyebrow nav-link-hover transition-colors ${
                  pathname === "/about" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                About
              </Link>
              <Link
                href="/pricing"
                className={`eyebrow nav-link-hover transition-colors ${
                  pathname === "/pricing" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pricing
              </Link>
              <Link
                href="/sign-in"
                className="eyebrow nav-link-hover text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Button
                asChild
                className="h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/85 font-medium px-5"
              >
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
