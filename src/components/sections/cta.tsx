import { Icons } from "~/components/icons";
import { Button } from "~/components/ui/button";

export function CallToAction() {
  return (
    <section className="bg-primary px-4 py-20 text-primary-foreground">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="mb-4 font-bold text-3xl md:text-4xl">
          Start Accepting Local Payments Today
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-xl opacity-90">
          Join hundreds of African creators who are already earning with local
          payments and Kit integration.
        </p>
        <Button size="lg" variant="secondary" className="px-8 text-lg">
          Get Started Free
          <Icons.arrowRight className="ml-2 h-5 w-5" />
        </Button>
        <p className="mt-4 text-sm opacity-75">
          No setup fees. No monthly charges. Start earning in minutes.
        </p>
      </div>
    </section>
  );
}
