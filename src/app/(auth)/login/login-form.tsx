"use client";
import { useMemo, useState } from "react";

import { authClient } from "~/auth/client";
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

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Log in to your account</CardTitle>
          <CardDescription>
            Continue with your GitHub account to log in
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <Button
                onClick={async () => {
                  if (loading) return;
                  setLoading(true);

                  try {
                    await authClient.signIn.social({
                      provider: "github",
                      callbackURL,
                    });
                  } catch (err) {
                    console.error("GitHub sign-in failed:", err);
                    // TODO: replace with your toast/notifier
                    alert("Sign-in failed. Please try again.");
                  } finally {
                    setLoading(false);
                  }
                }}
                type="button"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in with GitHub"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
