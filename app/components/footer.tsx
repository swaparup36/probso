import Link from "next/link"

interface FooterProps {
  className?: string
}

const linkClass = "text-sm text-muted-foreground hover:text-primary transition-colors"

export function Footer({ className = "" }: FooterProps) {
  return (
    <footer className={`border-t border-border bg-background ${className}`}>
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div>
            <h3 className="eyebrow text-white mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className={linkClass}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/pricing" className={linkClass}>
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="eyebrow text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className={linkClass}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={linkClass}>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="eyebrow text-white mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="eyebrow text-white mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className={linkClass}>
                  About Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8">
          <p className="fine-note text-center text-muted-foreground">© 2025 Probso. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
