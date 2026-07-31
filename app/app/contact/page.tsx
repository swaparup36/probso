"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MessageSquare } from "lucide-react"
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Header */}
      <Header showBack={true} />

      <section className="container mx-auto px-6 py-20 max-w-5xl relative z-10">
        <div className="mb-16 space-y-5">
          <p className="eyebrow text-primary">Contact</p>
          <h1 className="font-display text-5xl md:text-6xl font-medium text-white">
            Get in{" "}
            <span className="text-primary">
              Touch
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl font-light">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-white">Send us a message</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">Fill out the form and we'll get back to you within 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-input border-border text-white placeholder:text-muted-foreground focus-visible:ring-primary rounded-lg px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-input border-border text-white placeholder:text-muted-foreground focus-visible:ring-primary rounded-lg px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-white">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="How can we help?"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    className="bg-input border-border text-white placeholder:text-muted-foreground focus-visible:ring-primary rounded-lg px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us more about your inquiry..."
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    className="bg-input border-border text-white placeholder:text-muted-foreground focus-visible:ring-primary rounded-2xl px-4 py-3"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-white text-primary-foreground rounded-lg h-11 transition-all duration-300 mt-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-medium text-white">Email Us</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">We're here to help</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <a href="mailto:support@probso.live" className="text-primary hover:text-primary/80 transition-colors hover:underline text-sm font-semibold">
                  support@probso.live
                </a>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-medium text-white">Support</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">Get help with your account</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  For technical support and account issues, please email our support team.
                </p>
                <Button variant="outline" asChild className="bg-transparent border-border hover:bg-primary/10 text-primary hover:text-primary-foreground rounded-lg">
                  <a href="mailto:support@probso.live">Contact Support</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="pt-6">
                <h3 className="font-medium text-white mb-2 text-base">Response Time</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
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
