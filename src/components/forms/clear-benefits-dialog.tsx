"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";

interface ClearBenefitsDialogProps {
  publicationId: string;
  publicationName: string;
  benefitCount: number;
  onSuccess?: () => void;
}

export function ClearBenefitsDialog({
  publicationId,
  publicationName,
  benefitCount,
  onSuccess,
}: ClearBenefitsDialogProps) {
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();

  const clearBenefitsMutation = api.publication.clearBenefits.useMutation({
    onSuccess: () => {
      toast.success("All benefits cleared successfully");
      setOpen(false);
      onSuccess?.();
      void utils.publication.getBenefits.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleClear = () => {
    clearBenefitsMutation.mutate({
      publicationId,
    });
  };

  if (benefitCount === 0) {
    return null; // Don't show the button if there are no benefits
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive" className="h-8">
          <Trash2 className="mr-1 h-3 w-3" />
          Clear All
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Clear All Benefits</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove all {benefitCount} benefit
            {benefitCount !== 1 ? "s" : ""} from{" "}
            <strong>{publicationName}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={clearBenefitsMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleClear}
            disabled={clearBenefitsMutation.isPending}
          >
            {clearBenefitsMutation.isPending
              ? "Clearing..."
              : "Clear All Benefits"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
