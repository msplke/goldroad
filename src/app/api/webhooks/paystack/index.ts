import z from "zod";

import { env } from "~/env";
import { planSchema } from "~/server/fetch-clients/paystack/schemas/plan";
import { subscriptionStatusEnum } from "~/server/fetch-clients/paystack/schemas/subscription";
import { createHmac, timingSafeEqual } from "node:crypto";

// `invoice.update` also runs when a charge attempt fails, but
// it is considered a payment event as here while handling it,
// we will only consider successful attempts, and ignore failed attempts
export const PaymentEventEnum = z.enum([
  "subscription.create",
  "invoice.update",
  "invoice.payment_failed",
]);

export const CancellationEventEnum = z.enum([
  "subscription.disable",
  "subscription.not_renew",
]);

export type PaymentEvent = z.infer<typeof PaymentEventEnum>;
export type CancellationEvent = z.infer<typeof CancellationEventEnum>;

const PaystackWebhookBodySchema = z.object({
  event: z.string(), // Keep as string for initial parsing
  data: z.object({
    id: z.number().optional(),
    subscription_code: z.string().optional(),
    plan: planSchema.optional(),
    next_payment_date: z.coerce.date().nullable().optional(),
    amount: z.number().int(),
    status: z.string().optional(),
    customer: z.object({
      first_name: z.string(),
      last_name: z.string(),
      email: z.email(),
    }),
    subscription: z
      .object({
        status: subscriptionStatusEnum,
        subscription_code: z.string(),
        amount: z.number().int(),
        next_payment_date: z.coerce.date().nullable(),
      })
      .optional(),
  }),
});

export type PaystackWebhookBodyData = z.infer<
  typeof PaystackWebhookBodySchema.shape.data
>;

export function parseBody(rawBody: string) {
  try {
    const parsedBody = PaystackWebhookBodySchema.safeParse(JSON.parse(rawBody));
    if (!parsedBody.success) {
      console.log("Error parsing body:", parsedBody.error);
      return null;
    }
    return { event: parsedBody.data.event, data: parsedBody.data.data };
  } catch (error) {
    console.log("Error parsing JSON body:", error);
    return null;
  }
}

export function verifySignature(rawBody: string, req: Request) {
  const hash = createHmac("sha512", env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");

  const signature = req.headers.get("x-paystack-signature") ?? "";

  return (
    signature.length === hash.length &&
    timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(signature, "hex"))
  );
}
