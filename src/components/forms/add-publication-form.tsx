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
import { Textarea } from "~/components/ui/textarea";
import type { Step3FormData } from "~/lib/validators/onboarding";

type AddPublicationFormProps = {
  step3Form: UseFormReturn<Step3FormData>;
  handleStep3SubmitAction: (data: Step3FormData) => void;
};

export function AddPublicationForm({
  step3Form,
  handleStep3SubmitAction,
}: AddPublicationFormProps) {
  return (
    <Form {...step3Form}>
      <form
        onSubmit={step3Form.handleSubmit(handleStep3SubmitAction)}
        className="space-y-4"
      >
        <FormField
          control={step3Form.control}
          name="publicationName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Publication Name</FormLabel>
              <FormControl>
                <Input placeholder="My Newsletter" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={step3Form.control}
          name="publicationDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A weekly newsletter about..."
                  rows={4}
                  {...field}
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
