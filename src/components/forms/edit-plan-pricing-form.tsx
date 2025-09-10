"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { api } from "~/trpc/react";

const editPlanSchema = z.object({
  planId: z.uuid("Invalid plan ID"),
  amount: z.number().min(100, "Amount must be at least Ksh. 100"),
});

type EditPlanFormData = z.infer<typeof editPlanSchema>;

interface EditPlanPricingProps {
  plan: {
    id: string;
    name: string;
    amount: number;
    interval: string;
  };
}

export function EditPlanPricingForm({ plan }: EditPlanPricingProps) {
  const [isEditing, setIsEditing] = useState(false);
  const utils = api.useUtils();

  const form = useForm<EditPlanFormData>({
    resolver: zodResolver(editPlanSchema),
    defaultValues: {
      planId: plan.id,
      amount: plan.amount,
    },
  });

  const updatePlan = api.plan.updatePricing.useMutation({
    onSuccess: () => {
      toast.success(
        "Plan pricing updated successfully on Paystack and in your dashboard!",
      );
      setIsEditing(false);
      utils.plan.getByPublication.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update plan pricing");
    },
  });

  const onSubmit = (data: EditPlanFormData) => {
    updatePlan.mutate(data);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.reset();
  };

  if (isEditing) {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">
                  Price (KES per{" "}
                  {plan.interval === "monthly" ? "month" : "year"})
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={100}
                    placeholder="Amount in KES"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={updatePlan.isPending}
              className="flex-1"
            >
              {updatePlan.isPending ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={updatePlan.isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-muted-foreground text-sm">
          {formatAmount(plan.amount)} per{" "}
          {plan.interval === "monthly" ? "month" : "year"}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="h-8 w-8 p-0"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
