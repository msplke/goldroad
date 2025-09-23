"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

const MAX_BENEFITS_PER_PLAN = 4;

const addBenefitSchema = z.object({
  description: z
    .string()
    .min(1, "Benefit description is required")
    .max(500, "Benefit description must be less than 500 characters"),
});

type AddBenefitFormData = z.infer<typeof addBenefitSchema>;

interface AddBenefitFormProps {
  planId: string;
  planName: string;
  currentBenefitCount: number;
  onSuccess?: () => void;
}

export function AddBenefitForm({
  planId,
  planName,
  currentBenefitCount,
  onSuccess,
}: AddBenefitFormProps) {
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();

  const form = useForm<AddBenefitFormData>({
    resolver: zodResolver(addBenefitSchema),
    defaultValues: {
      description: "",
    },
  });

  const addBenefitMutation = api.plan.addBenefit.useMutation({
    onSuccess: () => {
      toast.success("Benefit added successfully");
      setOpen(false);
      form.reset();
      onSuccess?.();
      void utils.plan.getByPublication.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: AddBenefitFormData) => {
    addBenefitMutation.mutate({
      planId,
      description: data.description,
    });
  };

  const isAtLimit = currentBenefitCount >= MAX_BENEFITS_PER_PLAN;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={isAtLimit}
          className="h-8"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Benefit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Benefit</DialogTitle>
          <DialogDescription>
            Add a new benefit to the {planName} plan.
            {isAtLimit
              ? ` You've reached the maximum of ${MAX_BENEFITS_PER_PLAN} benefits per plan.`
              : ` (${currentBenefitCount}/${MAX_BENEFITS_PER_PLAN} benefits used)`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Benefit Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe what subscribers get with this plan..."
                      rows={3}
                      maxLength={500}
                    />
                  </FormControl>
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <FormMessage />
                    <span>{field.value.length}/500</span>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={addBenefitMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addBenefitMutation.isPending}>
                {addBenefitMutation.isPending ? "Adding..." : "Add Benefit"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
