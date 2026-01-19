import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Target, Users, Zap } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
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

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-12 text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground text-balance">About PDF2Video</h1>
          <p className="text-xl text-muted-foreground">
            Transforming how students learn with AI-powered video explanations
          </p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
          <Card className="p-8 border-border/50 shadow-lg">
            <h2 className="text-2xl font-bold text-foreground mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              We believe that everyone learns differently. While traditional textbooks work for some, many students
              grasp concepts better through visual and auditory learning. PDF2Video was created to bridge this gap by
              converting static PDF documents into engaging video explanations that make learning more accessible and
              effective.
            </p>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 border-border/50 shadow-lg text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Our Goal</h3>
              <p className="text-sm text-muted-foreground">Make quality education accessible to all learning styles</p>
            </Card>

            <Card className="p-6 border-border/50 shadow-lg text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Our Users</h3>
              <p className="text-sm text-muted-foreground">Thousands of students learning smarter every day</p>
            </Card>

            <Card className="p-6 border-border/50 shadow-lg text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Our Tech</h3>
              <p className="text-sm text-muted-foreground">Cutting-edge AI that understands and explains</p>
            </Card>
          </div>

          <Card className="p-8 border-border/50 shadow-lg">
            <h2 className="text-2xl font-bold text-foreground mb-4">How It Works</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Upload Your PDF</h4>
                  <p className="text-sm text-muted-foreground">
                    Simply drag and drop any PDF textbook, notes, or document into our platform.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">AI Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Our advanced AI reads and understands the content, identifying key concepts and explanations.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Video Generation</h4>
                  <p className="text-sm text-muted-foreground">
                    Watch as your PDF transforms into an engaging video tutorial with clear explanations and visuals.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="text-center pt-8">
            <Button size="lg" asChild className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/signup">Start Learning Today</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
