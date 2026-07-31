import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Footer } from "@/components/footer"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Header */}
      <Header showBack={true} />

      {/* Content Section */}
      <section className="container mx-auto px-6 py-20 relative z-10 max-w-4xl">
        <div className="mb-16 space-y-5">
          <p className="eyebrow text-primary">Legal</p>
          <h1 className="font-display text-5xl md:text-6xl font-medium text-white">
            Terms of{" "}
            <span className="text-primary">
              Service
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: December 22, 2025</p>
        </div>

        <Card className="p-8 md:p-12 glass-card text-left">
          <div className="prose prose-lg max-w-none space-y-8">
            <section className="space-y-4">
              <h2 className="text-xl font-medium text-white border-b border-border pb-2">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                By accessing and using PDF2Video ("the Service"), you accept and agree to be bound by the terms and
                provision of this agreement. If you do not agree to these Terms of Service, please do not use our Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-white border-b border-border pb-2">2. Use of Service</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                PDF2Video provides a platform to convert PDF documents into video explanations. You agree to use the
                Service only for lawful purposes and in accordance with these Terms.
              </p>
              <div className="ml-6 space-y-2">
                <p className="text-muted-foreground text-sm font-semibold">You agree NOT to:</p>
                <ul className="list-disc ml-6 space-y-2 text-muted-foreground text-sm">
                  <li>Upload content that violates copyright laws or intellectual property rights</li>
                  <li>Use the Service for any illegal or unauthorized purpose</li>
                  <li>Attempt to gain unauthorized access to the Service or its related systems</li>
                  <li>Upload malicious code or viruses</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-white border-b border-border pb-2">3. User Content</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                You retain all rights to the PDFs you upload to our Service. By uploading content, you grant PDF2Video a
                limited license to process your files for the purpose of generating video explanations. We do not claim
                ownership of your content.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-white border-b border-border pb-2">4. Privacy and Data Protection</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                We take your privacy seriously. Please review our Privacy Policy to understand how we collect, use, and
                protect your personal information.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-white border-b border-border pb-2">5. Service Availability</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                We strive to provide reliable service, but we do not guarantee that the Service will be available at all
                times. We may suspend or discontinue the Service at any time without prior notice.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-white border-b border-border pb-2">6. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                PDF2Video and its affiliates shall not be liable for any indirect, incidental, special, consequential, or
                punitive damages resulting from your use of or inability to use the Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-white border-b border-border pb-2">7. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes by
                posting the new Terms on this page. Your continued use of the Service after such modifications constitutes
                your acceptance of the updated Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-white border-b border-border pb-2">8. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                If you have any questions about these Terms, please contact us at:{" "}
                <a href="mailto:support@probso.live" className="text-primary hover:text-primary/80 transition-colors hover:underline font-semibold">
                  support@probso.live
                </a>
              </p>
            </section>
          </div>
        </Card>
      </section>

      <Footer />
    </div>
  )
}



