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
import type { Step1FormData } from "~/lib/validators/onboarding";

type AddKitApiKeyFormProps = {
  step1Form: UseFormReturn<Step1FormData>;
  handleStep1SubmitAction: (data: Step1FormData) => void;
};

export function AddKitApiKeyForm({
  step1Form,
  handleStep1SubmitAction,
}: AddKitApiKeyFormProps) {
  return (
    <Form {...step1Form}>
      <form
        onSubmit={step1Form.handleSubmit(handleStep1SubmitAction)}
        className="space-y-4"
      >
        <FormField
          control={step1Form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kit API Key</FormLabel>
              <FormControl>
                <Input placeholder="Your API key" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
