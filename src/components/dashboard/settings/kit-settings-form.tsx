"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Mail,
  Save,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
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
import { api } from "~/trpc/react";

const kitSettingsSchema = z.object({
  apiKey: z.string().min(1, "Kit API key is required"),
});

type KitSettingsFormData = z.infer<typeof kitSettingsSchema>;

export function KitSettingsForm() {
  const [showApiKey, setShowApiKey] = useState(false);

  const { data: creator, isLoading: isLoadingCreator } =
    api.creator.get.useQuery();
  const utils = api.useUtils();

  const updateKitApiKey = api.creator.addOrUpdateKitApiKey.useMutation({
    onSuccess: () => {
      toast.success("Kit integration updated successfully!");
      // Clear the form after successful submission
      form.reset({ apiKey: "" });
      // Invalidate and refetch creator data
      utils.creator.get.invalidate();
    },
    onError: () => {
      toast.error(
        "Failed to update Kit API key. Please ensure your API key is valid and try again.",
      );
    },
  });

  const form = useForm<KitSettingsFormData>({
    resolver: zodResolver(kitSettingsSchema),
    defaultValues: {
      apiKey: "",
    },
  });

  // Reset form when creator data changes
  useEffect(() => {
    if (creator) {
      // We don't show the actual API key for security reasons
      form.reset({
        apiKey: "",
      });
    }
  }, [creator, form]);

  const onSubmit = (data: KitSettingsFormData) => {
    updateKitApiKey.mutate({ kitApiKey: data.apiKey });
  };

  const isConnected = creator?.hasKitApiKey;
  const isLoading = isLoadingCreator || updateKitApiKey.isPending;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Kit Integration</CardTitle>
            {isConnected && (
              <Badge
                variant="default"
                className="bg-green-500 hover:bg-green-600"
              >
                Connected
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          Connect your Kit account to automatically sync paying subscribers to
          your mailing list.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your Kit API key will be encrypted and stored securely. We only
                use it to sync subscribers to your mailing list.
              </AlertDescription>
            </Alert>

            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kit API Key</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        placeholder={
                          isConnected
                            ? "Enter new API key to update"
                            : "Enter your Kit API key"
                        }
                        disabled={isLoading}
                        className="pr-10"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowApiKey(!showApiKey)}
                        disabled={isLoading}
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
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs">
                      Find your API key in your Kit account under Settings →
                      Account → API.
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      asChild
                    >
                      <Link
                        href="https://help.kit.com/en/articles/9902901-kit-api-overview"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        How to find your Kit API key
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </FormItem>
              )}
            />

            {isConnected && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">
                  Kit integration is active and working
                </span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !form.formState.isDirty}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {updateKitApiKey.isPending
                ? "Saving..."
                : isConnected
                  ? "Update API Key"
                  : "Save API Key"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
