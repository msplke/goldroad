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
import type { Step4FormData } from "~/lib/validators/onboarding";

type AddKitApiKeyFormProps = {
  step4Form: UseFormReturn<Step4FormData>;
  handleStep4SubmitAction: (data: Step4FormData) => void;
};

export function AddKitApiKeyForm({
  step4Form,
  handleStep4SubmitAction,
}: AddKitApiKeyFormProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <Form {...step4Form}>
      <form
        onSubmit={step4Form.handleSubmit(handleStep4SubmitAction)}
        className="space-y-4"
      >
        <FormField
          control={step4Form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kit API Key</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="Your API key (leave empty to skip)"
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
