import { tasks } from "@trigger.dev/sdk";
import { z } from "zod";

import { env } from "~/env";
import { planSchema } from "~/server/fetch-clients/paystack";
import type { createSubscriberTask } from "~/server/trigger/tasks";
import { createHmac, timingSafeEqual } from "node:crypto";

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

type PaymentEvent = z.infer<typeof PaymentEventEnum>;
type CancelEvent = z.infer<typeof CancelEventEnum>;

const PaystackWebhookBodySchema = z.object({
  event: z.string(), // Keep as string for initial parsing
  data: z.object({
    id: z.number(),
    subscription_code: z.string().optional(),
    plan: planSchema.optional(),
    status: z.string().optional(),
    customer: z.object({
      first_name: z.string(),
      last_name: z.string(),
      email: z.email(),
    }),
  }),
});

const OK_RESPONSE = new Response("OK", { status: 200 });
// const SERVER_ERROR_RESPONSE = new Response("Server Error", { status: 500 });

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
  const parsedBody = PaystackWebhookBodySchema.safeParse(JSON.parse(rawBody));
  if (!parsedBody.success) {
    console.log("Error parsing body:", parsedBody.error);
    return new Response("Unexpected request body", { status: 400 });
  }

  const webhookBody = parsedBody.data;
  const event = webhookBody.event;
  const data = webhookBody.data;

  // Check if it's a payment event
  if (PaymentEventEnum.safeParse(event).success) {
    // Type assertion is safe because we've validated with safeParse
    const paymentEvent = event as PaymentEvent;

    switch (paymentEvent) {
      case "subscription.create": {
        if (!data.subscription_code)
          return new Response("No subscription code", { status: 400 });
        if (!data.plan) return new Response("No plan info", { status: 400 });
        // Create a new subscriber on Kit and on app db

        const handle = await tasks.trigger<typeof createSubscriberTask>(
          "webhook:create-subscriber",
          {
            subscriberInfo: {
              email_address: data.customer.email,
              first_name: data.customer.first_name,
            },
            planCode: data.plan.plan_code,
            subscriptionCode: data.subscription_code,
          },
        );

        console.log(`Running create subscriber task with handle: ${handle}`);
        return OK_RESPONSE;
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

  return OK_RESPONSE;
}
