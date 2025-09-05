"use client";

import type { UseFormReturn } from "react-hook-form";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import type { Step4FormData } from "~/lib/validators/onboarding";

type AddPaymentPlanFormProps = {
  step4Form: UseFormReturn<Step4FormData>;
  handleStep4SubmitAction: (data: Step4FormData) => void;
};

export function AddPaymentPlanForm({
  step4Form,
  handleStep4SubmitAction,
}: AddPaymentPlanFormProps) {
  return (
    <Form {...step4Form}>
      <form
        onSubmit={step4Form.handleSubmit(handleStep4SubmitAction)}
        className="space-y-4"
      >
        {/* Hidden field for publication ID */}
        <FormField
          control={step4Form.control}
          name="publicationId"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <Input type="hidden" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={step4Form.control}
          name="monthlyAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Plan Amount (Ksh.)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="5000"
                  {...field}
                  onChange={(e) => field.onChange(+e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={step4Form.control}
          name="annualAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Annual Plan Amount (Ksh.)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="50000"
                  {...field}
                  onChange={(e) => field.onChange(+e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
