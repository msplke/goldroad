import { createFetch, createSchema } from "@better-fetch/fetch";
import { z } from "zod";

export const kitStateEnumSchema = z.enum([
  "active",
  "cancelled",
  "bounced",
  "complained",
  "inactive",
]);

// Can be filled later with the actual types as needed
export const kitFieldsSchema = z.record(z.string(), z.unknown());

export const kitTagSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date(),
});

export const kitPaginationSchema = z.object({
  has_previous_page: z.boolean(),
  has_next_page: z.boolean(),
  start_cursor: z.string(),
  end_cursor: z.string(),
  per_page: z.number(),
});

export const kitSubscriberSelectSchema = z.object({
  id: z.number(),
  first_name: z.string().nullable(),
  email_address: z.email(),
  state: kitStateEnumSchema,
  created_at: z.coerce.date(),
  fields: kitFieldsSchema,
});

export const kitSubscriberCreateSchema = z.object({
  email_address: z.string(),
  first_name: z.string().optional(),
  state: kitStateEnumSchema.optional(),
  fields: kitFieldsSchema.optional(),
});

export const kitSchema = createSchema(
  {
    // List all tags
    "@get/tags/": {
      output: z.object({
        tags: z.array(kitTagSchema),
        pagination: kitPaginationSchema,
      }),
    },

    // Create a new tag
    "@post/tags/": {
      input: z.object({
        name: z.string(),
      }),
      output: z.object({ tag: kitTagSchema }),
    },

    // List the subscribers for a given tag
    "@get/tags/:tagId/subscribers": {
      output: z.object({
        subscribers: z.array(kitSubscriberSelectSchema),
        pagination: kitPaginationSchema,
      }),
    },

    // Tag a subscriber
    "@post/tags/:tagId/subscribers/:subscriberId": {
      output: z.object({
        subscriber: kitSubscriberSelectSchema.extend({
          tagged_at: z.coerce.date(),
        }),
      }),
    },

    // Remove tag from subscriber
    "@delete/tags/:tagId/subscribers/:subscriberId": {},

    // Get a list of all subscribers
    "@get/subscribers/": {
      output: z.object({
        subscribers: z.array(kitSubscriberSelectSchema),
        pagination: kitPaginationSchema,
      }),
    },

    // Create a new subscriber (or upsert a new )
    "@post/subscribers/": {
      input: kitSubscriberCreateSchema,
      output: z.object({
        subscriber: kitSubscriberSelectSchema,
      }),
    },

    // Get a subscriber with a given id
    "@get/subscribers/:subscriberId": {
      output: z.object({
        subscriber: kitSubscriberSelectSchema,
      }),
    },

    // Upsert a subscriber
    "@put/subscribers/:subscriberId": {
      input: z.object({
        email_address: z.email().optional(),
        first_name: z.string().optional(),
        fields: kitFieldsSchema.optional(),
      }),
      output: z.object({
        subscriber: kitSubscriberSelectSchema,
      }),
    },

    // Remove a subscriber
    "@post/subscribers/:subscriberId/unsubscribe": {},
  },
  {
    strict: true,
  },
);

const KIT_BASE_URL = "https://api.kit.com/v4";
export const KIT_API_KEY_HEADER = "X-Kit-Api-Key";

export const kitClient = createFetch({
  baseURL: KIT_BASE_URL,
  schema: kitSchema,

  onRequest(context) {
    if (!context.headers.has(KIT_API_KEY_HEADER)) {
      throw new Error(`❌ kitClient: ${KIT_API_KEY_HEADER} not set`);
    }

    return context;
  },
});
