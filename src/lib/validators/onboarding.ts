import z from "zod";

// Form schemas for each onboarding step
export const step1Schema = z.object({
  apiKey: z.string().min(1, "Kit API key is required"),
});

export const step2Schema = z.object({
  bankCode: z.string().length(3, "Please select a bank"),
  accountNumber: z
    .string()
    .min(10, "Account number must be at least 10 digits"),
  accountName: z.string().min(2, "Account name is required"),
});

export const step3Schema = z.object({
  publicationName: z.string().min(1, "Publication name is required"),
  publicationDescription: z.string().optional(),
});

export const step4Schema = z.object({
  publicationId: z.uuid("Invalid publication ID"),
  monthlyAmount: z
    .number()
    .min(100, "Monthly amount must be at least Ksh. 100"),
  annualAmount: z
    .number()
    .min(1000, "Annual amount must be at least Ksh. 1000"),
});

export type Step1FormData = z.infer<typeof step1Schema>;
export type Step2FormData = z.infer<typeof step2Schema>;
export type Step3FormData = z.infer<typeof step3Schema>;
export type Step4FormData = z.infer<typeof step4Schema>;
