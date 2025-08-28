import Link from "next/link";

import { Icons } from "~/components/icons";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

export function HeroLanding() {
  return (
    <section className="py-20 px-4">
      <div className="container max-w-4xl mx-auto text-center">
        <Badge variant="secondary" className="mb-6">
          No Stripe needed. ConvertKit-compatible.
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">
          Accept Local Recurring Payments
        </h1>
        <p className="text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto">
          Accept recurring payments locally with Paystack, automatically sync
          paying subscribers into your ConvertKit, get payouts to your bank.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/login">
              Get Started Free
              <Icons.arrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="text-lg px-8 bg-transparent"
          >
            <a href="#how-it-works">See How It Works</a>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Payouts to your local bank. KYC verified creators only.
        </p>
      </div>
    </section>
  );
}
