"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit } from "lucide-react";
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

const editBenefitSchema = z.object({
  description: z
    .string()
    .min(1, "Benefit description is required")
    .max(500, "Benefit description must be less than 500 characters"),
});

type EditBenefitFormData = z.infer<typeof editBenefitSchema>;

interface EditBenefitFormProps {
  benefitId: string;
  currentDescription: string;
  onSuccess?: () => void;
}

export function EditBenefitForm({
  benefitId,
  currentDescription,
  onSuccess,
}: EditBenefitFormProps) {
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();

  const form = useForm<EditBenefitFormData>({
    resolver: zodResolver(editBenefitSchema),
    defaultValues: {
      description: currentDescription,
    },
  });

  const editBenefitMutation = api.plan.updateBenefit.useMutation({
    onSuccess: () => {
      toast.success("Benefit updated successfully");
      setOpen(false);
      onSuccess?.();
      void utils.plan.getByPublication.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: EditBenefitFormData) => {
    editBenefitMutation.mutate({
      benefitId,
      description: data.description,
    });
  };

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      form.reset({ description: currentDescription });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
          <Edit className="h-3 w-3" />
          <span className="sr-only">Edit benefit</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Benefit</DialogTitle>
          <DialogDescription>Update the benefit description.</DialogDescription>
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
                disabled={editBenefitMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editBenefitMutation.isPending}>
                {editBenefitMutation.isPending
                  ? "Updating..."
                  : "Update Benefit"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
