import { env } from "~/env";
import { createHmac } from "node:crypto";

interface PaystackWebhookEvent {
  event: string;
  data: {
    id: string;
    status: string;
    reference: string;
    amount: number; // Amount in subunits (e.g. 1000 (Paystack) = 10.00 (actual))
    paid_at: string; // UTC date string
    subaccount: Record<string, unknown>;
    metadata: {
      custom_fields: {
        display_name: string;
        variable_name: string;
        value: string;
      }[];
      unitId: string;
    };
  };
}

const defaultResponse = new Response("OK", { status: 200 });
const secret = env.PAYSTACK_SECRET_KEY;

const paymentEvents = new Set([
  "subscription.create",
  "invoice.payment_succeeded",
  "charge.success",
  "subscription.update",
]);

const cancelEvents = new Set([
  "subscription.disable",
  "subscription.cancelled",
  "invoice.payment_failed",
]);

export async function POST(req: Request) {
  const rawBody = await req.text();
  const hash = createHmac("sha512", secret).update(rawBody).digest("hex");

  if (hash !== req.headers.get("x-paystack-signature")) {
    return new Response("Invalid signature", { status: 401 });
  }

  const body = JSON.parse(rawBody) as PaystackWebhookEvent;
  const event = body.event;

  console.log("event:", event);
  console.log(body);

  if (paymentEvents.has(event)) {
    // Handle each payment event
  } else if (cancelEvents.has(event)) {
    // Handle each cancel event
  } else {
    // Unexpected event, just ignore
  }

  return defaultResponse;
}
