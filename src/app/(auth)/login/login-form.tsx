"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { authClient } from "~/auth/client";
import { Icons } from "~/components/icons";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export function LoginForm() {
  const [loading, setLoading] = useState(false);

  const callbackURL = useMemo(() => {
    if (typeof window === "undefined") return "/dashboard";
    const raw = new URLSearchParams(window.location.search).get("redirect");
    return raw?.startsWith("/") ? raw : "/dashboard";
  }, []);

  const handleSocialLogin = async (provider: "github" | "google") => {
    if (loading) return;
    setLoading(true);

    try {
      await authClient.signIn.social({
        provider,
        callbackURL,
      });
      // If we reach here, sign-in was successful but redirect hasn't happened yet
      // Keep loading state true to prevent duplicate clicks
    } catch (err) {
      console.error(`${provider} sign-in failed:`, err);
      toast.error("Sign-in failed. Please try again.");
      setLoading(false); // Only reset loading on error
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome</CardTitle>
          <CardDescription>
            Login with your Google or GitHub account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin("google")}
                className="w-full"
                disabled={loading}
              >
                <Icons.google />
                {loading ? "Signing in..." : "Sign in with Google"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin("github")}
                className="w-full"
                disabled={loading}
              >
                <Icons.gitHub />
                {loading ? "Signing in..." : "Sign in with GitHub"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
