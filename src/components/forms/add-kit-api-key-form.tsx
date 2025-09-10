"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { Button } from "~/components/ui/button";
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
  const [showApiKey, setShowApiKey] = useState(false);

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
                <div className="relative">
                  <Input
                    placeholder="Your API key"
                    type={showApiKey ? "text" : "password"}
                    className="pr-10"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showApiKey ? "Hide API key" : "Show API key"}
                    </span>
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
