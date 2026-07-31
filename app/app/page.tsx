import { Header } from "@/components/header"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Zap, Brain, BookOpen } from "lucide-react"
import { auth } from "@clerk/nextjs/server";
import Converter from "@/components/converter";
import FeatureCard from "@/components/ui/feature-card";
import { Footer } from "@/components/footer"
import { HeroDropzone } from "@/components/hero-dropzone"


export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    return (
      <Converter />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Hero section */}
      <section className="relative">
        <div className="container mx-auto px-6 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">
          {/* Left: Text */}
          <div className="flex flex-col items-start text-left">
            <div className="eyebrow flex items-center gap-2.5 text-white/70 mb-10">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-slow" />
              PDF → Narrated Video
            </div>

            <h1 className="font-display text-6xl md:text-7xl xl:text-[5.5rem] font-medium mb-10">
              <span className="block text-white">Your PDF,</span>
              <span className="block text-primary">watchable.</span>
            </h1>

            <p className="text-lg md:text-xl text-white/85 max-w-lg mb-12 leading-relaxed font-light">
              Probso reads the document, writes the script, and renders a narrated video — figures,
              charts and page citations intact.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/sign-up"
                className="flex h-12 items-center justify-center rounded-lg bg-primary px-7 text-[15px] font-medium text-primary-foreground transition-colors duration-200 hover:bg-white"
              >
                Upload a PDF
              </Link>
              <Link
                href="/pricing"
                className="flex h-12 items-center justify-center rounded-lg border border-white px-7 text-[15px] font-medium text-white transition-colors duration-200 hover:bg-white hover:text-black"
              >
                Watch a sample
              </Link>
            </div>

            <p className="fine-note text-muted-foreground mt-8">
              Free plan included · up to 20 pages per PDF
            </p>
          </div>

          {/* Right: Drop zone */}
          <div className="w-full">
            <HeroDropzone />
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="relative py-24 md:py-32 border-t border-border">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="max-w-2xl mb-16 space-y-5">
            <p className="eyebrow text-primary">Why Probso</p>
            <h2 className="font-display text-4xl md:text-5xl font-medium text-white">
              Built for how you actually study.
            </h2>
            <p className="text-lg text-muted-foreground font-light leading-relaxed">
              Experience a revolutionary way to learn with AI-generated video explanations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <FeatureCard className="glass-card" spotlightColor="rgba(199, 196, 247, 0.08)">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 mb-6">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-medium text-white mb-3">Lightning Fast</CardTitle>
              <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                Get your video explanations in minutes. Our AI processes PDFs quickly and efficiently.
              </CardDescription>
            </FeatureCard>

            <FeatureCard className="glass-card" spotlightColor="rgba(199, 196, 247, 0.08)">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 mb-6">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-medium text-white mb-3">AI-Powered Learning</CardTitle>
              <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                Advanced AI understands complex concepts and creates clear, engaging visual explanations.
              </CardDescription>
            </FeatureCard>

            <FeatureCard className="glass-card" spotlightColor="rgba(199, 196, 247, 0.08)">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 mb-6">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-medium text-white mb-3">Better Retention</CardTitle>
              <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                Studies show visual learning increases retention by up to 65%. Make learning stick.
              </CardDescription>
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="relative py-24 md:py-32 border-t border-border">
        <div className="container mx-auto px-6">
          <Card className="glass-card max-w-4xl mx-auto rounded-2xl">
            <div className="p-10 md:p-16 text-center space-y-7">
              <p className="eyebrow text-primary">Get started</p>
              <h2 className="font-display text-4xl md:text-5xl font-medium text-white text-balance">
                Ready to learn smarter?
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto font-light">
                Join thousands of students who are transforming the way they study.
              </p>
              <div className="flex justify-center pt-2">
                <Link
                  href="/sign-up"
                  className="flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-[15px] font-medium text-primary-foreground transition-colors duration-200 hover:bg-white"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  )
}
