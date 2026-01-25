import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <Button variant="ghost" asChild className="bg-transparent">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      {/* Content Section */}
      <section className="container mx-auto px-4 py-20 bg-[#0b0b16]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[#E5E5FE] mb-4">Terms of Service</h1>
            <p className="text-lg text-muted-foreground">Last updated: December 22, 2025</p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-[#E5E5FE]">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using PDF2Video ("the Service"), you accept and agree to be bound by the terms and
                provision of this agreement. If you do not agree to these Terms of Service, please do not use our Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-[#E5E5FE]">2. Use of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                PDF2Video provides a platform to convert PDF documents into video explanations. You agree to use the
                Service only for lawful purposes and in accordance with these Terms.
              </p>
              <div className="ml-6 space-y-2">
                <p className="text-muted-foreground">You agree NOT to:</p>
                <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                  <li>Upload content that violates copyright laws or intellectual property rights</li>
                  <li>Use the Service for any illegal or unauthorized purpose</li>
                  <li>Attempt to gain unauthorized access to the Service or its related systems</li>
                  <li>Upload malicious code or viruses</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-[#E5E5FE]">3. User Content</h2>
              <p className="text-muted-foreground leading-relaxed">
                You retain all rights to the PDFs you upload to our Service. By uploading content, you grant PDF2Video a
                limited license to process your files for the purpose of generating video explanations. We do not claim
                ownership of your content.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-[#E5E5FE]">4. Privacy and Data Protection</h2>
              <p className="text-muted-foreground leading-relaxed">
                We take your privacy seriously. Please review our Privacy Policy to understand how we collect, use, and
                protect your personal information.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-[#E5E5FE]">5. Service Availability</h2>
              <p className="text-muted-foreground leading-relaxed">
                We strive to provide reliable service, but we do not guarantee that the Service will be available at all
                times. We may suspend or discontinue the Service at any time without prior notice.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-[#E5E5FE]">6. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                PDF2Video and its affiliates shall not be liable for any indirect, incidental, special, consequential, or
                punitive damages resulting from your use of or inability to use the Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-[#E5E5FE]">7. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes by
                posting the new Terms on this page. Your continued use of the Service after such modifications constitutes
                your acceptance of the updated Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-[#E5E5FE]">8. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms, please contact us at:{" "}
                <a href="mailto:support@probso.live" className="text-[#7c7dda] hover:text-[#6a70de] hover:underline transition-colors">
                  support@probso.live
                </a>
              </p>
            </section>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8">
            <p className="text-center text-sm text-muted-foreground">© 2025 PDF2Video. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
