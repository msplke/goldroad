import { Icons } from "~/components/icons";
import { Button } from "~/components/ui/button";

export function CallToAction() {
  return (
    <section className="py-20 px-4 bg-primary text-primary-foreground">
      <div className="container max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Start Accepting Local Payments Today
        </h2>
        <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
          Join hundreds of African creators who are already earning with local
          payments and ConvertKit integration.
        </p>
        <Button size="lg" variant="secondary" className="text-lg px-8">
          Get Started Free
          <Icons.arrowRight className="ml-2 h-5 w-5" />
        </Button>
        <p className="text-sm opacity-75 mt-4">
          No setup fees. No monthly charges. Start earning in minutes.
        </p>
      </div>
    </section>
  );
}
