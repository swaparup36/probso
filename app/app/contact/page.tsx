"use client"

import type React from "react"

import { useState } from "react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Mail, MessageSquare } from "lucide-react"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"
import { Footer } from "@/components/footer"

export default function ContactPage() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/create-support-message`, {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        toast({
          title: "Message Sent",
          description: "Your message has been sent successfully!"
        })
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        })
      } else {
        console.log("Error submitting support message: ", response.data);
        toast({
          variant: "destructive",
          title: "Error",
          description: "There was an error sending your message. Please try again later."
        })
      }
      setIsSubmitting(false)
    } catch (error) {
      console.log("Error submiting support message: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error sending your message. Please try again later."
      })
    } finally {
      setIsSubmitting(false)
    }
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
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 max-w-5xl">
        <div className="mb-16 text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-[#E5E5FE] text-balance">Get in Touch</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-border/50 shadow-xl bg-[#252435]/70">
            <CardHeader>
              <CardTitle className="text-[#E5E5FE]">Send us a message</CardTitle>
              <CardDescription>Fill out the form and we'll get back to you within 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="How can we help?"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us more about your inquiry..."
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#7c7dda] hover:bg-[#6a70de] text-white rounded-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/50 shadow-xl bg-[#252435]/70">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7c7dda]/10">
                    <Mail className="h-5 w-5 text-[#9e9ee1]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-[#E5E5FE]">Email Us</CardTitle>
                    <CardDescription>We're here to help</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <a href="mailto:support@probso.live" className="text-[#7c7dda] hover:underline">
                  support@probso.live
                </a>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-xl bg-[#252435]/70">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7c7dda]/10">
                    <MessageSquare className="h-5 w-5 text-[#9e9ee1]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-[#E5E5FE]">Support</CardTitle>
                    <CardDescription>Get help with your account</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  For technical support and account issues, please email our support team.
                </p>
                <Button variant="outline" asChild className="bg-transparent border-[#7c7dda]/30 hover:bg-[#7c7dda]/10">
                  <a href="mailto:support@probso.live">Contact Support</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-xl bg-[#252435]/70">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-[#E5E5FE] mb-2">Response Time</h3>
                <p className="text-sm text-muted-foreground">
                  We typically respond to all inquiries within 24 hours during business days. For urgent issues, please
                  mark your email as high priority.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
