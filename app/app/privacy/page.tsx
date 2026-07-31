import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Footer } from "@/components/footer"

import { Card } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Header */}
      <Header showBack={true} />

      <div className="container mx-auto px-6 py-20 max-w-4xl relative z-10">
        <div className="mb-16 space-y-5">
          <p className="eyebrow text-primary">Legal</p>
          <h1 className="font-display text-5xl md:text-6xl font-medium text-white">
            Privacy{" "}
            <span className="text-primary">
              Policy
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: December 22, 2025</p>
        </div>

        <Card className="p-8 md:p-12 glass-card text-left">
          <div className="prose prose-lg max-w-none space-y-8">
            <section className="space-y-4">
              <h2 className="text-xl font-medium text-white border-b border-border pb-2">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                We collect information you provide directly to us when you create an account, upload PDFs, and use our
                Service. This includes:
              </p>
              <ul className="list-disc ml-6 space-y-2 text-muted-foreground text-sm">
                <li>Account information (name, email address, password)</li>
                <li>PDF documents you upload for conversion</li>
                <li>Usage data and analytics</li>
                <li>Device and browser information</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-white border-b border-border pb-2">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">We use the information we collect to:</p>
              <ul className="list-disc ml-6 space-y-2 text-muted-foreground text-sm">
                <li>Provide, maintain, and improve our Service</li>
                <li>Process your PDF to video conversions</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Analyze usage patterns to improve user experience</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-white border-b border-border pb-2">3. Data Storage and Security</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                We implement appropriate technical and organizational measures to protect your personal data against
                unauthorized access, alteration, disclosure, or destruction. Your PDF files are processed securely and are
                automatically deleted after 30 days unless you choose to save them.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-white border-b border-border pb-2">4. Sharing of Information</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                We do not sell, trade, or rent your personal information to third parties. We may share your information
                only in the following circumstances:
              </p>
              <ul className="list-disc ml-6 space-y-2 text-muted-foreground text-sm">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety</li>
                <li>
                  With service providers who assist in operating our Service (under strict confidentiality agreements)
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-white border-b border-border pb-2">5. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">You have the right to:</p>
              <ul className="list-disc ml-6 space-y-2 text-muted-foreground text-sm">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data</li>
                <li>Opt-out of marketing communications</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-white border-b border-border pb-2">6. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                We use cookies and similar tracking technologies to collect information about your browsing activities.
                You can control cookies through your browser settings, but disabling them may affect your ability to use
                certain features of our Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-white border-b border-border pb-2">7. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Our Service is not intended for children under 13 years of age. We do not knowingly collect personal
                information from children under 13. If you are a parent or guardian and believe your child has provided us
                with personal information, please contact us.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-white border-b border-border pb-2">8. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
                Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-white border-b border-border pb-2">9. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                If you have any questions about this Privacy Policy, please contact us at:{" "}
                <a href="mailto:admin@probso.live" className="text-primary hover:text-primary/80 transition-colors hover:underline font-semibold">
                  admin@probso.live
                </a>
              </p>
            </section>
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  )
}
