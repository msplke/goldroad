import Link from "next/link";

import { Icons } from "~/components/icons";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

export function HeroLanding() {
  return (
    <section className="px-4 py-20">
      <div className="container mx-auto max-w-4xl text-center">
        <Badge variant="secondary" className="mb-6">
          No Stripe needed. Kit-compatible.
        </Badge>
        <h1 className="mb-6 text-balance font-bold text-4xl md:text-6xl">
          Accept Local Recurring Payments
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-balance text-muted-foreground text-xl">
          Accept recurring payments locally with Paystack. Optionally sync
          paying subscribers to Kit. Get payouts to your bank.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="px-8 text-lg"
            render={
              <Link href="/login">
                Get Started Free
                <Icons.arrowRight className="ml-2 h-5 w-5" />
              </Link>
            }
          />

          <Button
            variant="outline"
            size="lg"
            className="bg-transparent px-8 text-lg"
            render={<a href="#how-it-works">See How It Works</a>}
          />
        </div>
      </div>
    </section>
  );
}
