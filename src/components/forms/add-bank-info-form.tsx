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

type AddBankInfoFormProps = {
  step2Form: UseFormReturn<Step2FormData>;
  handleStep2SubmitAction: (data: Step2FormData) => void;
};

export function AddBankInfoForm({
  step2Form,
  handleStep2SubmitAction,
}: AddBankInfoFormProps) {
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                </FormControl>

                <SelectContent>
                  {[
                    { value: "044", label: "Access Bank" },
                    { value: "014", label: "Afribank" },
                    { value: "023", label: "Citibank" },
                    { value: "050", label: "Ecobank" },
                    { value: "011", label: "First Bank" },
                    {
                      value: "214",
                      label: "First City Monument Bank",
                    },
                    { value: "070", label: "Fidelity Bank" },
                    {
                      value: "058",
                      label: "Guaranty Trust Bank",
                    },
                    { value: "030", label: "Heritage Bank" },
                    { value: "082", label: "Keystone Bank" },
                    { value: "076", label: "Polaris Bank" },
                    {
                      value: "221",
                      label: "Stanbic IBTC Bank",
                    },
                    {
                      value: "068",
                      label: "Standard Chartered",
                    },
                    { value: "232", label: "Sterling Bank" },
                    { value: "032", label: "Union Bank" },
                    {
                      value: "033",
                      label: "United Bank for Africa",
                    },
                    { value: "215", label: "Unity Bank" },
                    { value: "035", label: "Wema Bank" },
                    { value: "057", label: "Zenith Bank" },
                  ].map((bank) => (
                    <SelectItem key={bank.value} value={bank.value}>
                      {bank.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
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
