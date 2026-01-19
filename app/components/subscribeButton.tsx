"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { handleCheckoutSession } from "@/utils/subscriptionHandler";

type Props = {
  planId: string;
  label: string;
  popular?: boolean;
};

export default function SubscribeButton({ planId, label, popular }: Props) {
  const onClick = async () => {
    const checkoutUrl = await handleCheckoutSession(planId);
    if (!checkoutUrl) {
        console.error("Failed to get checkout URL");
        alert("Failed to initiate checkout. Please try again later.");
        return;
    }

    window.location.href = checkoutUrl;
  };
  return (
    <Button
      className={`w-full h-11 ${
        popular ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-transparent"
      }`}
      variant={popular ? "default" : "outline"}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}