import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Check } from "lucide-react";
import SubscribeButton from "@/components/subscribeButton";
import { Footer } from "@/components/footer";

export default function PricingPage() {
  const plans = [
    {
      id: "free_plan",
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out PDF2Video",
      features: [
        "1 PDF conversions per month",
        "PDFs up to 5 pages",
        "Standard quality",
        "Email support",
      ],
      cta: "Start Free",
      popular: false,
    },
    {
      id: "pdt_0NX4LAmkycnrjvjCyjWas",
      name: "Starter Plan",
      price: "$20",
      period: "per month",
      description: "For students & casual users",
      features: [
        "30 tokens / month",
        "PDFs up to 10 pages",
        "Standard narration voice",
        "Unused tokens do not carry forward",
        "Email support",
      ],
      cta: "Upgrade",
      popular: true,
    },
    {
      id: "pdt_0NX4LAMhk99P9UlUjlIA0",
      name: "Creator Plan",
      price: "$50",
      period: "per month",
      description: "For content creators & educators",
      features: [
        "80 tokens / month",
        "PDFs up to 20 pages",
        "Standard narration voice",
        "Shared conversion",
        "Download videos",
        "No watermark",
        "Email support",
      ],
      cta: "Upgrade",
      popular: false,
    },
    // {
    //   id: "pdt_0NWMLhzZYvu8UByoIrkDy",
    //   name: "Pro Plan",
    //   price: "$49",
    //   period: "per month",
    //   description: "For professionals & teams",
    //   features: [
    //     "1200 tokens / month",
    //     "PDFs up to 30 pages",
    //     "Standard narration voice",
    //     "Shared conversion",
    //     "No watermark",
    //     "Dedicated support",
    //   ],
    //   cta: "Get Team",
    //   popular: false,
    // },
  ];

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

      {/* Pricing Hero Section */}
      <section className="px-4 py-10 bg-[#0b0b16]">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-[#E5E5FE] leading-tight mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-[#B0B3F3] max-w-2xl mx-auto">
            Choose the plan that fits your learning needs
          </p>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="container mx-auto px-4 py-20 bg-[#0b0b16]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative border-border/50 shadow-lg bg-[#252435]/70 ${
                  plan.popular
                    ? "border-2 border-[#7c7dda] shadow-xl scale-105"
                    : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-[#7c7dda] text-white text-sm font-semibold px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-8 pt-8">
                  <CardTitle className="text-2xl mb-2 text-[#E5E5FE]">{plan.name}</CardTitle>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-[#E5E5FE]">
                      {plan.price}
                    </span>
                    <span className="text-[#B0B3F3] ml-2">
                      /{plan.period}
                    </span>
                  </div>
                  <CardDescription className="text-[#B0B3F3]">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-[#9e9ee1] shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <SubscribeButton
                    planId={plan.id}
                    label={plan.cta}
                    popular={plan.popular}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="border-border/50 shadow-lg bg-[#252435]/70">
              <CardHeader>
                <CardTitle className="text-[#E5E5FE]">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-[#E5E5FE] mb-2">
                    Can I change my plan later?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Yes, you can upgrade or downgrade your plan at any time.
                    Changes take effect immediately.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#E5E5FE] mb-2">
                    What payment methods do you accept?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    We accept all major credit cards, PayPal, and bank transfers
                    for annual plans.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#E5E5FE] mb-2">
                    Is there a refund policy?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Yes, we offer a 30-day money-back guarantee for all paid
                    plans. No questions asked.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer className="" />
    </div>
  );
}
