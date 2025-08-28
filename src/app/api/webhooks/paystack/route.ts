import { z } from "zod";

import { env } from "~/env";
import { api } from "~/trpc/server";
import { createHmac, timingSafeEqual } from "node:crypto";

// Define event types using Zod
const PaymentEventEnum = z.enum([
  "subscription.create",
  "invoice.payment_succeeded",
  "charge.success",
]);

const CancelEventEnum = z.enum([
  "subscription.disable",
  "subscription.cancelled",
  "invoice.payment_failed",
]);

// Combine them for all valid events that the application cares about
// const EventEnum = z.union([PaymentEventEnum, CancelEventEnum]);

// Extract TypeScript types
type PaymentEvent = z.infer<typeof PaymentEventEnum>;
type CancelEvent = z.infer<typeof CancelEventEnum>;

// type PaystackWebhookEvent = z.infer<typeof EventEnum>;

// Define the webhook payload schema
const PaystackWebhookBodySchema = z.object({
  event: z.string(), // Keep as string for initial parsing
  data: z.object({
    id: z.number(),
    subscription_code: z.string().optional(),
    status: z.string(),
    customer: z.object({
      first_name: z.string(),
      last_name: z.string(),
      email: z.email(),
    }),
  }),
});

// type PaystackWebhookBody = z.infer<typeof PaystackWebhookBodySchema>;

const defaultResponse = new Response("OK", { status: 200 });

export async function POST(req: Request) {
  const rawBody = await req.text();
  const hash = createHmac("sha512", env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");

  const signature = req.headers.get("x-paystack-signature") ?? "";

  if (
    !(signature.length === hash.length) ||
    !timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(signature, "hex"))
  ) {
    return new Response("Invalid signature", { status: 401 });
  }

  // Parse the webhook payload
  const webhookData = PaystackWebhookBodySchema.parse(JSON.parse(rawBody));
  const { event } = webhookData;

  // Check if it's a payment event
  if (PaymentEventEnum.safeParse(event).success) {
    // Type assertion is safe because we've validated with safeParse
    const paymentEvent = event as PaymentEvent;

    // You get autocomplete here!
    switch (paymentEvent) {
      case "subscription.create": {
        const data = webhookData.data;
        if (!data.subscription_code)
          return new Response("No subscription code", { status: 400 });

        // Create a new subscriber on Kit
        await api.subscriber.create({
          subscriberInfo: { email_address: data.customer.email },
          paystackInfo: {
            subscriptionCode: data.subscription_code,
          },
        });

        break;
      }
      case "invoice.payment_succeeded":
        // Handle payment succeeded
        break;
      case "charge.success":
        // Handle charge success
        break;
    }
  }
  // Check if it's a cancel event
  else if (CancelEventEnum.safeParse(event).success) {
    const cancelEvent = event as CancelEvent;

    // You get autocomplete here!
    switch (cancelEvent) {
      case "subscription.disable":
        // Handle subscription disable
        break;
      case "subscription.cancelled":
        // Handle subscription cancelled
        break;
      case "invoice.payment_failed":
        // Handle payment failed
        break;
    }
  } else {
    // Unexpected event, just ignore
    console.log("Unexpected event type:", event);
  }

  return defaultResponse;
}
