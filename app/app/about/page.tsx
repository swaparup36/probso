import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Target, Users, Zap } from "lucide-react"
import { Footer } from "@/components/footer"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Header */}
      <Header showBack={true} />

      <div className="container mx-auto px-6 py-16 max-w-4xl relative z-10">
        <div className="mb-16 space-y-5">
          <p className="eyebrow text-primary">About Probso</p>
          <h1 className="font-display text-5xl md:text-6xl font-medium text-white">
            About{" "}
            <span className="text-primary">
              PDF2Video
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl font-light">
            Transforming how students learn with AI-powered video explanations
          </p>
        </div>

        <div className="prose prose-lg max-w-none space-y-10">
          <Card className="p-8 glass-card">
            <h2 className="text-2xl font-medium text-white mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              We believe that everyone learns differently. While traditional textbooks work for some, many students
              grasp concepts better through visual and auditory learning. PDF2Video was created to bridge this gap by
              converting static PDF documents into engaging video explanations that make learning more accessible and
              effective.
            </p>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 glass-card text-center flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <Target className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Our Goal</h3>
              <p className="text-sm text-muted-foreground">Make quality education accessible to all learning styles</p>
            </Card>

            <Card className="p-6 glass-card text-center flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Our Users</h3>
              <p className="text-sm text-muted-foreground">Thousands of students learning smarter every day</p>
            </Card>

            <Card className="p-6 glass-card text-center flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Our Tech</h3>
              <p className="text-sm text-muted-foreground">Cutting-edge AI that understands and explains</p>
            </Card>
          </div>

          <Card className="p-8 glass-card">
            <h2 className="text-2xl font-medium text-white">How It Works</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-medium text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1 text-base">Upload Your PDF</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Simply drag and drop any PDF textbook, notes, or document into our platform.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-medium text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1 text-base">AI Analysis</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Our advanced AI reads and understands the content, identifying key concepts and explanations.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-medium text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1 text-base">Video Generation</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Watch as your PDF transforms into an engaging video tutorial with clear explanations and visuals.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="text-center pt-8">
            <Button size="lg" asChild className="h-12 px-8 bg-primary hover:bg-white text-primary-foreground text-base rounded-lg transition-all duration-300">
              <Link href="/sign-up">Start Learning Today</Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
