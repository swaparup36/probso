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
import { ArrowLeft, Check } from "lucide-react";
import SubscribeButton from "@/components/subscribeButton";

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
      id: "pdt_0NWMcSlIp6bojBCUJbnZJ",
      name: "Starter Plan",
      price: "$10",
      period: "per month",
      description: "For students & casual users",
      features: [
        "150 tokens / month",
        "PDFs up to 10 pages",
        "Standard narration voice",
        "Unused tokens do not carry forward",
        "Email support",
      ],
      cta: "Upgrade",
      popular: true,
    },
    {
      id: "pdt_0NWMcm5GDBUjZP1TqkLSa",
      name: "Creator Plan",
      price: "$25",
      period: "per month",
      description: "For content creators & educators",
      features: [
        "500 tokens / month",
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

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="mb-16 text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground text-balance">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose the plan that fits your learning needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border-border/50 shadow-lg ${
                plan.popular
                  ? "border-2 border-primary shadow-xl scale-105"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    /{plan.period}
                  </span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
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
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Can I change my plan later?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time.
                  Changes take effect immediately.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-sm text-muted-foreground">
                  We accept all major credit cards, PayPal, and bank transfers
                  for annual plans.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">
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
    </div>
  );
}
