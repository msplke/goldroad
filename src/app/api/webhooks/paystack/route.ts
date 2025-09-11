import { parseBody, verifySignature } from "~/app/api/webhooks/paystack";
import { handleWebhookEvent } from "~/app/api/webhooks/paystack/events";

export async function POST(req: Request) {
  const rawBody = await req.text();
  if (!verifySignature(rawBody, req)) {
    return new Response("Invalid signature", { status: 400 });
  }

  // Parse the webhook payload
  const result = parseBody(rawBody);
  if (!result) {
    return new Response("Invalid payload", { status: 400 });
  }

  const { event, data } = result;
  console.log(`Received Paystack webhook event: ${event}`);

  await handleWebhookEvent(event, data);

  return new Response("OK", { status: 200 });
}
