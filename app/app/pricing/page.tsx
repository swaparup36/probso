import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Header */}
      <Header />

      {/* Pricing Hero Section */}
      <section className="relative px-4 py-20 z-10">
        <div className="container mx-auto max-w-6xl space-y-5">
          <p className="eyebrow text-primary">Pricing</p>
          <h1 className="font-display text-5xl md:text-6xl font-medium text-white">
            Simple, Transparent{" "}
            <span className="text-primary">
              Pricing
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl font-light">
            Choose the plan that fits your learning needs
          </p>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="relative container mx-auto px-4 py-12 z-10">
        <div className="max-w-6xl mx-auto space-y-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative glass-card flex flex-col justify-between h-full ${
                  plan.popular
                    ? "border-2 border-primary md:scale-105"
                    : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-25">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-md">
                      Most Popular
                    </span>
                  </div>
                )}
                <div>
                  <CardHeader className="text-center pb-8 pt-8">
                    <CardTitle className="text-2xl font-medium mb-2 text-white">{plan.name}</CardTitle>
                    <div className="mb-2">
                      <span className="text-4xl font-medium text-white">
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground ml-1 text-sm">
                        /{plan.period}
                      </span>
                    </div>
                    <CardDescription className="text-sm text-muted-foreground">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ul className="space-y-4">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </div>
                <div className="p-6 pt-0 mt-6">
                  <SubscribeButton
                    planId={plan.id}
                    label={plan.cta}
                    popular={plan.popular}
                  />
                </div>
              </Card>
            ))}
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-2xl font-medium text-white text-center md:text-left">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-b border-border pb-4">
                  <h3 className="font-semibold text-white mb-2">
                    Can I change my plan later?
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Yes, you can upgrade or downgrade your plan at any time.
                    Changes take effect immediately.
                  </p>
                </div>
                <div className="border-b border-border pb-4">
                  <h3 className="font-semibold text-white mb-2">
                    What payment methods do you accept?
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We accept all major credit cards, PayPal, and bank transfers
                    for annual plans.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Is there a refund policy?
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Yes, we offer a 30-day money-back guarantee for all paid
                    plans. No questions asked.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}












