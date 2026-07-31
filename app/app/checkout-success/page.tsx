
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import axios from "axios";
import { useUser } from "@clerk/nextjs";

type VerificationState = "loading" | "success" | "failed";

function CheckoutSuccessContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();

  const status = searchParams.get("status");
  const subscriptionId = searchParams.get("subscription_id");
  console.log("subscription_id: ", subscriptionId);

  const [state, setState] = useState<VerificationState>("loading");
  const [message, setMessage] = useState("Verifying your subscription...");

  useEffect(() => {
    if (!subscriptionId || !user) {
      console.log("Waiting for subscription ID or user...");
      return;
    }
    verifySubscription(subscriptionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionId, user]);

  async function verifySubscription(subscriptionId: string) {
    if (!user) {
      setState("failed");
      setMessage("User not authenticated.");
      return;
    }

    try {
      if (!status || status == 'failed') {
        console.log("Status: ", status);
        setState("failed");
        setMessage("Payment status failed or not found");
        return;
      }
      const createSubscriptionResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/create-subscription`,
        {
          subscription_id: subscriptionId,
          userId: user.id,
        }
      );

      console.log(
        "createSubscriptionResponse: ",
        createSubscriptionResponse.data
      );

      setState("success");
      setMessage("Subscription activated successfully 🎉");
    } catch (error) {
      console.error(error);
      setState("failed");
      setMessage("Failed to verify subscription.");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-xl w-full glass-card rounded-2xl p-10 text-center">
        <h1 className="font-display text-3xl font-medium text-white mb-3">
          Subscription Status
        </h1>

        <p className="fine-note text-muted-foreground mb-8 break-all">
          Subscription ID: {subscriptionId}
        </p>

        {state === "loading" && <StatusBadge color="purple" text="Verifying..." />}
        {state === "success" && <StatusBadge color="green" text="Active" />}
        {state === "failed" && <StatusBadge color="red" text="Failed" />}

        <p className="mt-6 text-muted-foreground">{message}</p>

        <div className="mt-10">
          {state === "success" && (
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-white transition-colors"
            >
              Go to Dashboard
            </a>
          )}

          {state === "failed" && (
            <a
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg border border-white px-6 py-3 text-white font-medium hover:bg-white hover:text-black transition-colors"
            >
              Retry Payment
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
