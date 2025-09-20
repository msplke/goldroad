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
import type { Step2FormData } from "~/lib/validators/onboarding";

type AddPublicationFormProps = {
  step2Form: UseFormReturn<Step2FormData>;
  handleStep2SubmitAction: (data: Step2FormData) => void;
};

export function AddPublicationForm({
  step2Form,
  handleStep2SubmitAction,
}: AddPublicationFormProps) {
  return (
    <Form {...step2Form}>
      <form
        onSubmit={step2Form.handleSubmit(handleStep2SubmitAction)}
        className="space-y-4"
      >
        <FormField
          control={step2Form.control}
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
          control={step2Form.control}
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
