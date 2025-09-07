"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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
import { generateSlugFromName } from "~/lib/utils";
import { api } from "~/trpc/react";

const editPublicationSchema = z.object({
  id: z.uuid("Invalid publication ID"),
  name: z
    .string()
    .min(1, "Publication name is required")
    .max(100, "Publication name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Invalid characters in name"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(100, "Slug must be less than 100 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    )
    .refine((slug) => !slug.startsWith("-") && !slug.endsWith("-"), {
      message: "Slug cannot start or end with a hyphen",
    })
    .refine((slug) => !slug.includes("--"), {
      message: "Slug cannot contain consecutive hyphens",
    }),
});

type EditPublicationFormData = z.infer<typeof editPublicationSchema>;

interface EditPublicationFormProps {
  publication: {
    id: string;
    name: string;
    description: string | null;
    slug: string;
  };
}

export function EditPublicationForm({ publication }: EditPublicationFormProps) {
  const utils = api.useUtils();

  const form = useForm<EditPublicationFormData>({
    resolver: zodResolver(editPublicationSchema),
    defaultValues: {
      id: publication.id,
      name: publication.name,
      description: publication.description ?? "",
      slug: publication.slug,
    },
  });

  const updatePublication = api.publication.update.useMutation({
    onSuccess: () => {
      toast.success("Publication updated successfully!");
      utils.publication.getForEdit.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update publication");
    },
  });

  const handleGenerateSlug = () => {
    const currentName = form.getValues("name");
    if (currentName) {
      const newSlug = generateSlugFromName(currentName);
      form.setValue("slug", newSlug);
      toast.success("Slug generated from publication name!");
    } else {
      toast.error("Please enter a publication name first");
    }
  };

  const onSubmit = (data: EditPublicationFormData) => {
    updatePublication.mutate({
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      slug: data.slug,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publication Details</CardTitle>
        <CardDescription>
          Update your publication name, URL slug, and description.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
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
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Publication Slug</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="my-newsletter"
                        {...field}
                        onChange={(e) => {
                          // Convert to lowercase and replace invalid characters
                          const value = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "-")
                            .replace(/-+/g, "-")
                            .replace(/^-|-$/g, "");
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleGenerateSlug}
                      title="Generate slug from publication name"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                  <p className="text-muted-foreground text-sm">
                    This creates your publication URL: /publication/
                    {field.value || "your-slug"}
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
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

            <Button
              type="submit"
              disabled={updatePublication.isPending}
              className="w-full sm:w-auto"
            >
              {updatePublication.isPending
                ? "Updating..."
                : "Update Publication"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
