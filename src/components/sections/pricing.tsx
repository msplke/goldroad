import Link from "next/link";

import { Icons } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

export function Pricing() {
  return (
    <section id="pricing" className="bg-muted/30 px-4 py-20">
      <div className="container mx-auto max-w-2xl text-center">
        <h2 className="mb-4 font-bold text-3xl md:text-4xl">
          Simple, Transparent Pricing
        </h2>
        <p className="mb-12 text-muted-foreground text-xl">
          No monthly fees. Pay only when you earn.
        </p>

        <Card className="border-2 border-primary shadow-lg">
          <CardContent className="p-8">
            <div className="mb-6 text-center">
              <div className="mb-2 font-bold text-5xl text-primary">5%</div>
              <div className="text-muted-foreground text-xl">
                per successful transaction
              </div>
            </div>

            <ul className="mb-8 space-y-3">
              <li className="flex items-center">
                <Icons.checkCircle className="mr-3 h-5 w-5 text-primary" />
                <span>Unlimited recurring & one-time subscribers</span>
              </li>
              <li className="flex items-center">
                <Icons.checkCircle className="mr-3 h-5 w-5 text-primary" />
                <span>Kit sync (optional — connect anytime)</span>
              </li>
              <li className="flex items-center">
                <Icons.checkCircle className="mr-3 h-5 w-5 text-primary" />
                <span>Bank payouts in 1-2 working days</span>
              </li>
              <li className="flex items-center">
                <Icons.checkCircle className="mr-3 h-5 w-5 text-primary" />
                <span>24/7 support</span>
              </li>
            </ul>

            <Button asChild size="lg" className="w-full text-lg">
              <Link href="/login" aria-label="Start accepting payments">
                Start Accepting Payments
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
