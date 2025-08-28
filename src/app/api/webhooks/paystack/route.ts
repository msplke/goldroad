import { z } from "zod";

import { env } from "~/env";
import { createSubscriber } from "~/server/actions/webhooks/paystack";
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
    status: z.string(),
    customer: z.object({
      first_name: z.string(),
      last_name: z.string(),
      email: z.email(),
    }),
  }),
});

const OK_RESPONSE = new Response("OK", { status: 200 });
const SERVER_ERROR_RESPONSE = new Response("Server Error", { status: 500 });

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
  if (parsedBody.error) {
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

        // Create a new subscriber on Kit and on app db
        try {
          // Check if subscriber exists in app db
          // const subscriber = await getBySubscriptionCode();
          // if (subscriber) {
          //   return OK_RESPONSE;
          // }
          await createSubscriber(
            { email_address: data.customer.email },
            data.subscription_code,
          );
        } catch (error) {
          console.error("Unable to save subscriber");
          console.error(error);
          return SERVER_ERROR_RESPONSE;
        }

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
