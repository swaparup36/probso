"use server";

import DodoPayments from 'dodopayments';
import type { Price } from 'dodopayments/resources/products';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: 'test_mode', // 'live_mode' for production
});

export async function handleCheckoutSession(productId: string) {
    try {
        console.log("DODO_PAYMENTS_API_KEY: ", process.env.DODO_PAYMENTS_API_KEY);
        const session = await client.checkoutSessions.create({
            product_cart: [
                {
                    product_id: productId,
                    quantity: 1
                }
            ],
            return_url: `${process.env.FRONTEND_URL}/checkout/success`,
        });

        console.log('Redirect to:', session.checkout_url);
        return session.checkout_url;
    } catch (error) {
        console.log("Error checking out for plan: ", error);
    }
}

export async function verifyDodoSubscription(subscriptionId: string) {
    try {
        const subscription = await client.subscriptions.retrieve(subscriptionId);
        return subscription;
    } catch (error) {
        console.error("Error verifying subscription: ", error);
        return null;
    }
}

function extractPriceAmount(price?: Price | null): number | null {
  if (!price) {
    return null;
  }

  if (price.type === 'usage_based_price') {
    return price.fixed_price ?? null;
  }

  return price.price ?? null;
}

export async function getDodoPlanDetails(productId: string) {
  try {
    const product = await client.products.retrieve(productId);

    return {
      name: product.name,
      description: product.description,
      price: extractPriceAmount(product.price),
    };
  } catch (error) {
    console.error("Failed to fetch plan:", error);
    throw new Error("Unable to fetch plan details");
  }
}
