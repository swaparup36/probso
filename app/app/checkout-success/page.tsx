
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
      console.log("SubscriptionId not found");
      setState("failed");
      setMessage("Missing subscription ID.");
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
    <div className="min-h-screen bg-gradient-to-br from-[#f7f7ff] to-[#ecebff] flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Subscription Status
        </h1>

        <p className="text-gray-600 mb-8">
          Subscription ID: <span className="font-mono">{subscriptionId}</span>
        </p>

        {state === "loading" && <StatusBadge color="purple" text="Verifying..." />}
        {state === "success" && <StatusBadge color="green" text="Active" />}
        {state === "failed" && <StatusBadge color="red" text="Failed" />}

        <p className="mt-6 text-gray-700">{message}</p>

        <div className="mt-10">
          {state === "success" && (
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-6 py-3 text-white font-medium hover:bg-purple-700 transition"
            >
              Go to Dashboard
            </a>
          )}

          {state === "failed" && (
            <a
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl border border-purple-600 px-6 py-3 text-purple-600 font-medium hover:bg-purple-50 transition"
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
