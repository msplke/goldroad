import { Icons } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

export function Pricing() {
  return (
    <section id="pricing" className="py-20 px-4 bg-muted/30">
      <div className="container max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-xl text-muted-foreground mb-12">
          No monthly fees. Pay only when you earn.
        </p>

        <Card className="border-2 border-primary shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-primary mb-2">5%</div>
              <div className="text-xl text-muted-foreground">
                per successful transaction
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <Icons.checkCircle className="h-5 w-5 text-primary mr-3" />
                <span>Unlimited subscribers</span>
              </li>
              <li className="flex items-center">
                <Icons.checkCircle className="h-5 w-5 text-primary mr-3" />
                <span>ConvertKit integration</span>
              </li>
              <li className="flex items-center">
                <Icons.checkCircle className="h-5 w-5 text-primary mr-3" />
                <span>Local bank payouts</span>
              </li>
              <li className="flex items-center">
                <Icons.checkCircle className="h-5 w-5 text-primary mr-3" />
                <span>24/7 support</span>
              </li>
            </ul>
            <Button size="lg" className="w-full text-lg">
              Start Accepting Payments
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
