import { idempotencyKeys, tasks } from "@trigger.dev/sdk";
import z from "zod";

import {
  type PaymentEvent,
  type PaystackWebhookBodyData,
  paystackWebhookDataSchema,
} from "~/app/api/webhooks/paystack";
import { fromSubunitsToBaseUnits, objectIsEmpty } from "~/lib/utils";
import type {
  addSuccessfulOneTimePaymentTask,
  createSubscriberTask,
  updateOnFailedSubsequentPaymentTask,
  updateOnSuccessfulSubsequentPaymentTask,
} from "~/server/trigger/tasks";

export async function handlePaymentEvent(
  event: PaymentEvent,
  data: PaystackWebhookBodyData,
) {
  switch (event) {
    case "charge.success": {
      await handleOneTimePaymentSuccessEvent(data);
      break;
    }
    case "subscription.create": {
      await handleSubscriptionCreationEvent(data);
      break;
    }
    case "invoice.payment_failed": {
      await handleFailedPaymentEvent(data);
      break;
    }
    case "invoice.update": {
      await handleSuccessfulSubscriptionPaymentEvent(data);
      break;
    }
  }
}

const strictlyEmptyObjectSchema = z
  .object({})
  .refine((data) => objectIsEmpty(data), {
    error: "Object should not have any keys.",
  });

const oneTimePaymentSchema = z.object({
  ...paystackWebhookDataSchema.shape,
  reference: z.string(),
  subscription: strictlyEmptyObjectSchema.optional(),
  plan: strictlyEmptyObjectSchema,
  subscription_code: z.undefined(),
  split: paystackWebhookDataSchema.shape.split.nonoptional(),
  metadata: z.object({
    referrer: z.url(),
  }),
});

async function handleOneTimePaymentSuccessEvent(data: PaystackWebhookBodyData) {
  const result = oneTimePaymentSchema.safeParse(data);
  if (result.error) {
    console.log("This is not a one-time payment. Not processed.");
    console.log(result.error);
    return;
  }

  const parsedData = result.data;

  const paymentPageSlug = parsedData.metadata.referrer.split("/").at(-1);
  if (!paymentPageSlug) {
    console.log(
      "Unable to find payment page slug, which is required to find the publication that was paid for.",
    );
    return;
  }

  const idempotencyKey = await idempotencyKeys.create(
    `record-successful-one-time-payment-${parsedData.reference}`,
  );

  const handle = await tasks.trigger<typeof addSuccessfulOneTimePaymentTask>(
    "webhook:add-successful-one-time-payment",
    {
      amount: fromSubunitsToBaseUnits(parsedData.amount),
      firstName: parsedData.customer.first_name,
      lastName: parsedData.customer.last_name,
      email: parsedData.customer.email,
      channel: parsedData.authorization.channel,
      paystackPaymentReference: parsedData.reference,
      paymentPageSlug,
    },
    { idempotencyKey },
  );
  console.log(
    `Running one-time payment task with handle: ${JSON.stringify(handle)}`,
  );
}

async function handleSubscriptionCreationEvent(data: PaystackWebhookBodyData) {
  if (!data.subscription_code) {
    console.log("No subscription code in subscription.create event, ignoring");
    return;
  }
  if (!data.plan || objectIsEmpty(data.plan)) {
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

  const idempotencyKey = await idempotencyKeys.create(
    `paystack-subscription-create-${data.subscription_code}`,
  );

  // Create a new subscriber on Kit and on app db
  const handle = await tasks.trigger<typeof createSubscriberTask>(
    "webhook:create-subscriber",
    {
      subscriberInfo: {
        email_address: data.customer.email,
        first_name: data.customer.first_name,
      },
      nextPaymentDate: data.next_payment_date,
      amount: fromSubunitsToBaseUnits(data.amount),
      planCode: data.plan.plan_code,
      subscriptionCode: data.subscription_code,
    },
    { idempotencyKey },
  );

  console.log(
    `Running create subscriber task with handle: ${JSON.stringify(handle)}`,
  );
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

  const idempotencyKey = await idempotencyKeys.create(
    `paystack-invoice-payment-failed-${data.subscription.subscription_code}`,
  );

  const handle = await tasks.trigger<
    typeof updateOnFailedSubsequentPaymentTask
  >(
    "webhook:update-on-failed-subsequent-payment",

    {
      subscriptionCode: data.subscription.subscription_code,
      planCode: data.plan.plan_code,
    },
    { idempotencyKey },
  );
  console.log(
    `Running update on subsequent payment task with handle: ${JSON.stringify(
      handle,
    )}`,
  );
}

async function handleSuccessfulSubscriptionPaymentEvent(
  data: PaystackWebhookBodyData,
) {
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

  const idempotencyKey = await idempotencyKeys.create(
    `paystack-invoice-payment-success-${data.subscription.subscription_code}`,
  );

  const handle = await tasks.trigger<
    typeof updateOnSuccessfulSubsequentPaymentTask
  >(
    "webhook:update-on-subsequent-payment",

    {
      subscriptionCode: data.subscription.subscription_code,
      planCode: data.plan.plan_code,
      nextPaymentDate: data.subscription.next_payment_date,
      amount: fromSubunitsToBaseUnits(data.amount),
    },
    { idempotencyKey },
  );
  console.log(
    `Running update on subsequent payment task with handle: ${JSON.stringify(
      handle,
    )}`,
  );
}
