import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, Zap, Brain, BookOpen } from "lucide-react"
import { auth } from "@clerk/nextjs/server";
import Converter from "@/components/converter";
import Spline from '@splinetool/react-spline/next';
import FeatureCard from "@/components/ui/feature-card";
import LiquidEther from "@/components/liquid-ether"


export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    console.log("first")
    return (
      <Converter />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex justify-start">
            <Logo />
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/about"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block"
            >
              About
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block"
            >
              Pricing
            </Link>
            <Button variant="ghost" asChild className="bg-transparent">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild className="rounded-full bg-[#7c7dda] hover:bg-[#6a70de] text-sm text-white">
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>
      

      {/* Hero section */}
      <section className="px-4 h-screen relative bg-[#c3bcf0]">
        {/* Right: Spline scene */}
        <Spline
          className="absolute right-0 top-0 w-1/2 h-full z-0"
          scene="https://prod.spline.design/nPcJUmHWdQjpwVv1/scene.splinecode"
        />

        {/* Left: Text */}
        <div className="relative z-30 w-full md:w-1/2 py-20 px-20">
          <h1 className="text-4xl md:text-6xl font-bold text-[#E5E5FE] leading-tight mb-6">
            Transform PDFs <br />
            into Video <br />
            Lessons
          </h1>

          <p className="text-lg text-[#B0B3F3] max-w-xl mb-10">
            Convert textbooks and documents into engaging video explanations.
            Learn faster with AI-powered visual content tailored to your learning style.
          </p>

          <div className="flex items-center">
            <Link
              className="group flex items-center gap-3 h-14 px-4 rounded-full 
                        bg-[#7c7dda] hover:bg-[#6a70de] 
                        text-white text-base font-medium 
                        transition-all"
              href="/login"
            >
              Generate Video
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
                ↗
              </span>
            </Link>
          </div>
        </div>

      </section>

      {/* Features section */}
      <section className="container mx-auto px-4 py-20 bg-[#0b0b16]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl text-[#E5E5FE] font-bold mb-4">Why Choose PDF2Video?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience a revolutionary way to learn with AI-generated video explanations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard className="custom-spotlight-card" spotlightColor="rgba(176, 181, 246, 0.2)">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg mb-4">
                <Zap className="h-6 w-6 text-[#9e9ee1]" />
              </div>
              <CardTitle className="mb-2">Lightning Fast</CardTitle>
              <CardDescription>
                Get your video explanations in minutes. Our AI processes PDFs quickly and efficiently.
              </CardDescription>
            </FeatureCard>

            <FeatureCard className="custom-spotlight-card" spotlightColor="rgba(176, 181, 246, 0.2)">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg mb-4">
                <Brain className="h-6 w-6 text-[#9e9ee1]" />
              </div>
              <CardTitle className="mb-2">AI-Powered Learning</CardTitle>
              <CardDescription>
                Advanced AI understands complex concepts and creates clear, engaging visual explanations.
              </CardDescription>
            </FeatureCard>

            <FeatureCard className="custom-spotlight-card" spotlightColor="rgba(176, 181, 246, 0.2)">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg mb-4">
                <BookOpen className="h-6 w-6 text-[#9e9ee1]" />
              </div>
              <CardTitle className="mb-2">Better Retention</CardTitle>
              <CardDescription>
                Studies show visual learning increases retention by up to 65%. Make learning stick.
              </CardDescription>
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <div style={{ width: '100%', height: 600, position: 'relative' }}>
      <LiquidEther
        colors={[ '#5227FF', '#FF9FFC', '#B19EEF' ]}
        mouseForce={20}
        cursorSize={100}
        isViscous={false}
        viscous={30}
        iterationsViscous={32}
        iterationsPoisson={32}
        resolution={0.5}
        isBounce={false}
        autoDemo={true}
        autoSpeed={0.5}
        autoIntensity={2.2}
        takeoverDuration={0.25}
        autoResumeDelay={3000}
        autoRampDuration={0.6}
      >
        <Card className="max-w-4xl mx-auto border-border/50 shadow-xl bg-[#252435]/70 from-primary/5 to-accent/5">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">Ready to Learn Smarter?</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Join thousands of students who are transforming the way they study
            </p>
            <Button size="lg" asChild className="h-12 px-8 bg-[#7c7dda] hover:bg-[#6a70de] text-white text-base rounded-full">
              <Link href="/signup">Get Started Free</Link>
            </Button>
          </CardContent>
        </Card>
      </LiquidEther>
    </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm mt-20">
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
