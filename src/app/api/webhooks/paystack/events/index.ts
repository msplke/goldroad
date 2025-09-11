import {
  type CancellationEvent,
  CancellationEventEnum,
  type PaymentEvent,
  PaymentEventEnum,
  type PaystackWebhookBodyData,
} from "~/app/api/webhooks/paystack";
import { handleCancellationEvent } from "~/app/api/webhooks/paystack/events/cancellation";
import { handlePaymentEvent } from "~/app/api/webhooks/paystack/events/payment";

export async function handleWebhookEvent(
  event: string,
  data: PaystackWebhookBodyData,
) {
  // Check if it's a payment event
  if (PaymentEventEnum.safeParse(event).success) {
    await handlePaymentEvent(event as PaymentEvent, data);
  }
  // Check if it's a cancel event
  else if (CancellationEventEnum.safeParse(event).success) {
    await handleCancellationEvent(event as CancellationEvent, data);
  } else {
    // Unexpected event, just ignore
    console.log("Unexpected event type:", event);
  }
}
