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
import type { Step3FormData } from "~/lib/validators/onboarding";

type AddPaymentPlanFormProps = {
  step3Form: UseFormReturn<Step3FormData>;
  handleStep3SubmitAction: (data: Step3FormData) => void;
};

export function AddPaymentPlanForm({
  step3Form,
  handleStep3SubmitAction,
}: AddPaymentPlanFormProps) {
  return (
    <Form {...step3Form}>
      <form
        onSubmit={step3Form.handleSubmit(handleStep3SubmitAction)}
        className="space-y-4"
      >
        {/* Hidden field for publication ID */}
        <FormField
          control={step3Form.control}
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
          control={step3Form.control}
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
          control={step3Form.control}
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
