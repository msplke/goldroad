import { idempotencyKeys, tasks } from "@trigger.dev/sdk";

import type {
  CancellationEvent,
  PaystackWebhookBodyData,
} from "~/app/api/webhooks/paystack";
import type {
  subscriptionCancelledTask,
  subscriptionDisabledTask,
} from "~/server/trigger/tasks";

export async function handleCancellationEvent(
  event: CancellationEvent,
  data: PaystackWebhookBodyData,
) {
  switch (event) {
    case "subscription.disable": {
      await handleSubscriptionDisabledEvent(data);
      break;
    }
    case "subscription.not_renew": {
      await handleSubscriptionCancelledEvent(data);
      break;
    }
  }
}

export async function handleSubscriptionDisabledEvent(
  data: PaystackWebhookBodyData,
) {
  if (!data.subscription_code) {
    console.log("No subscription code in subscription.disable event, ignoring");
    return;
  }
  if (!data.plan) {
    console.log("No plan info in subscription.disable event, ignoring");
    return;
  }

  const idempotencyKey = await idempotencyKeys.create(
    `paystack-subscription-disable-${data.subscription_code}`,
  );

  const handle = await tasks.trigger<typeof subscriptionDisabledTask>(
    "webhook:handle-subscription-disabled",
    {
      subscriptionCode: data.subscription_code,
      planCode: data.plan.plan_code,
    },
    { idempotencyKey },
  );
  console.log(
    `Running handle subscription completed task with handle: ${JSON.stringify(
      handle,
    )}`,
  );
}

export async function handleSubscriptionCancelledEvent(
  data: PaystackWebhookBodyData,
) {
  if (!data.subscription_code) {
    console.log(
      "No subscription code in subscription.not_renew event, ignoring",
    );
    return;
  }

  if (!data.plan) {
    console.log("No plan info in subscription.not_renew event, ignoring");
    return;
  }

  const idempotencyKey = await idempotencyKeys.create(
    `paystack-subscription-not-renew-${data.subscription_code}`,
  );

  // Handle subscription cancelled
  const handle = await tasks.trigger<typeof subscriptionCancelledTask>(
    "webhook:handle-subscription-cancelled",
    {
      subscriptionCode: data.subscription_code,
      planCode: data.plan.plan_code,
    },
    { idempotencyKey },
  );
  console.log(
    `Running handle subscription cancelled task with handle: ${JSON.stringify(
      handle,
    )}`,
  );
}
