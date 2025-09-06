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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { Step2FormData } from "~/lib/validators/onboarding";
import { api } from "~/trpc/react";

type AddBankInfoFormProps = {
  step2Form: UseFormReturn<Step2FormData>;
  handleStep2SubmitAction: (data: Step2FormData) => void;
};

export function AddBankInfoForm({
  step2Form,
  handleStep2SubmitAction,
}: AddBankInfoFormProps) {
  const { data: response, isLoading, isError } = api.paystack.bank.useQuery({});

  return (
    <Form {...step2Form}>
      <form
        onSubmit={step2Form.handleSubmit(handleStep2SubmitAction)}
        className="space-y-4"
      >
        <FormField
          control={step2Form.control}
          name="bankCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isLoading || isError}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoading ? "Loading banks..." : "Select your bank"
                      }
                    />
                  </SelectTrigger>
                </FormControl>

                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading banks...
                    </SelectItem>
                  ) : isError ? (
                    <SelectItem value="error" disabled>
                      Failed to load banks
                    </SelectItem>
                  ) : (
                    response?.map((bank) => {
                      return (
                        <SelectItem key={bank.id} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
              {isError && (
                <p className="mt-1 text-red-500 text-sm">
                  Failed to load banks. Please try again later.
                </p>
              )}
            </FormItem>
          )}
        />
        <FormField
          control={step2Form.control}
          name="accountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Number</FormLabel>
              <FormControl>
                <Input placeholder="1234567890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={step2Form.control}
          name="accountName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
