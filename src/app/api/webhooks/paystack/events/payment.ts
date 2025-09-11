import { tasks } from "@trigger.dev/sdk";

import type {
  PaymentEvent,
  PaystackWebhookBodyData,
} from "~/app/api/webhooks/paystack";
import type {
  createSubscriberTask,
  updateOnFailedSubsequentPaymentTask,
  updateOnSuccessfulSubsequentPaymentTask,
} from "~/server/trigger/tasks";

export async function handlePaymentEvent(
  event: PaymentEvent,
  data: PaystackWebhookBodyData,
) {
  switch (event) {
    case "subscription.create": {
      await handleSubscriptionCreationEvent(data);
      break;
    }
    case "invoice.payment_failed": {
      await handleFailedPaymentEvent(data);
      break;
    }
    case "invoice.update": {
      await handleSuccessfulPaymentEvent(data);
      break;
    }
  }
}

async function handleSubscriptionCreationEvent(data: PaystackWebhookBodyData) {
  if (!data.subscription_code) {
    console.log("No subscription code in subscription.create event, ignoring");
    return;
  }
  if (!data.plan) {
    console.log("No plan info in subscription.create event, ignoring");
    return;
  }
  if (!data.next_payment_date) {
    console.log("No next payment date in subscription.create event, ignoring");
    return;
  }
  if (!data.amount) {
    console.log("No amount info in subscription.create event, ignoring");
    return;
  }

  // Create a new subscriber on Kit and on app db
  const handle = await tasks.trigger<typeof createSubscriberTask>(
    "webhook:create-subscriber",
    {
      subscriberInfo: {
        email_address: data.customer.email,
        first_name: data.customer.first_name,
      },
      nextPaymentDate: data.next_payment_date,
      amount: data.amount / 100, // Convert from subunits to units
      planCode: data.plan.plan_code,
      subscriptionCode: data.subscription_code,
    },
  );

  console.log(`Running create subscriber task with handle: ${handle}`);
}

async function handleFailedPaymentEvent(data: PaystackWebhookBodyData) {
  if (!data.plan) {
    console.log("No plan info in invoice.update event, ignoring");
    return;
  }
  if (!data.subscription) {
    console.log("No subscription info in invoice.update event, ignoring");
    return;
  }

  const handle = await tasks.trigger<
    typeof updateOnFailedSubsequentPaymentTask
  >(
    "webhook:update-on-failed-subsequent-payment",

    {
      subscriptionCode: data.subscription.subscription_code,
      planCode: data.plan.plan_code,
    },
  );
  console.log(
    `Running update on subsequent payment task with handle: ${handle}`,
  );
}

async function handleSuccessfulPaymentEvent(data: PaystackWebhookBodyData) {
  // Check if the invoice update is for a successful charge attempt
  if (data.status !== "success") {
    console.log(`Ignoring invoice.update event with status: ${data.status}`);
    return;
  }
  if (!data.amount) {
    console.log("No amount info in invoice.update event, ignoring");
    return;
  }
  if (!data.plan) {
    console.log("No plan info in invoice.update event, ignoring");
    return;
  }
  if (!data.subscription) {
    console.log("No subscription info in invoice.update event, ignoring");
    return;
  }
  if (!data.subscription.next_payment_date) {
    console.log("No next payment date in subscription info, ignoring");
    return;
  }
  const handle = await tasks.trigger<
    typeof updateOnSuccessfulSubsequentPaymentTask
  >(
    "webhook:update-on-subsequent-payment",

    {
      subscriptionCode: data.subscription.subscription_code,
      planCode: data.plan.plan_code,
      nextPaymentDate: data.subscription.next_payment_date,
      amount: data.amount / 100, // Convert from subunits to units
    },
  );
  console.log(
    `Running update on subsequent payment task with handle: ${handle}`,
  );
}
