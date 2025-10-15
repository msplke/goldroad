import z from "zod";

/** General shape of a subaccount */
export const subaccountSchema = z.object({
  id: z.number(),
  subaccount_code: z.string(),
  business_name: z.string(),
  description: z.string().optional(),
  primary_contact_name: z.string().nullable().optional(),
  primary_contact_email: z.string().nullable().optional(),
  primary_contact_phone: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  percentage_charge: z.number(),
  settlement_bank: z.string(),
  account_number: z.string(),
  settlement_schedule: z
    .string()
    // .enum(["auto", "weekly", "monthly", "manual"])
    .optional(),
  active: z.boolean(),
  migrate: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Trimmed `subaccountSchema` for shape of info required to create a subaccount */
export const createSubaccountSchema = subaccountSchema.omit({
  id: true,
  subaccount_code: true,
  active: true,
  createdAt: true,
  updatedAt: true,
});
