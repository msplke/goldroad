"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { siteConfig } from "~/config/site";

interface PublicationShareLinkProps {
  publicationSlug: string;
}

export function PublicationShareLink({
  publicationSlug,
}: PublicationShareLinkProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${siteConfig.url}/publication/${publicationSlug}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");

      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const openInNewTab = () => {
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publication Share Link</CardTitle>
        <CardDescription>
          Share this link with potential subscribers to let them view your
          publication and subscribe.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input value={shareUrl} readOnly className="flex-1" />
          <Button
            variant="outline"
            size="icon"
            onClick={copyToClipboard}
            title="Copy link"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={openInNewTab}
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={copyToClipboard} className="flex-1">
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </>
            )}
          </Button>
          <Button variant="outline" onClick={openInNewTab} className="flex-1">
            <ExternalLink className="mr-2 h-4 w-4" />
            Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
