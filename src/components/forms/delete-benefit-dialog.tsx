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

interface DeleteBenefitDialogProps {
  benefitId: string;
  benefitDescription: string;
  onSuccess?: () => void;
}

export function DeleteBenefitDialog({
  benefitId,
  benefitDescription,
  onSuccess,
}: DeleteBenefitDialogProps) {
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();

  const deleteBenefitMutation = api.publication.deleteBenefit.useMutation({
    onSuccess: () => {
      toast.success("Benefit deleted successfully");
      setOpen(false);
      onSuccess?.();
      void utils.publication.getBenefits.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = () => {
    deleteBenefitMutation.mutate({
      benefitId,
    });
  };

  // Truncate description for display
  const displayDescription =
    benefitDescription.length > 50
      ? `${benefitDescription.substring(0, 50)}...`
      : benefitDescription;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
          <span className="sr-only">Delete benefit</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Benefit</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this benefit? This action cannot be
            undone.
            <br />
            <br />
            <strong>Benefit:</strong> {displayDescription}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={deleteBenefitMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteBenefitMutation.isPending}
          >
            {deleteBenefitMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
