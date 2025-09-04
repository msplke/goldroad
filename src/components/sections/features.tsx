import { HeaderSection } from "~/components/header-section";
import { Icons } from "~/components/icons";
import { MaxWidthWrapper } from "~/components/max-width-wrapper";
import { features } from "~/config/marketing";

export function Features() {
  return (
    <section id="features">
      <MaxWidthWrapper className="py-24">
        <HeaderSection
          label="Features"
          title="Built for African Creators"
          subtitle="Everything you need to monetize your audience locally."
        />

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = Icons[feature.icon] ?? Icons.checkCircle;

            return (
              <div
                className="group relative overflow-hidden rounded-2xl border bg-background p-5 md:p-8"
                key={feature.title}
              >
                <div
                  aria-hidden="true"
                  className="-translate-y-1/2 group-hover:-translate-y-1/4 absolute inset-0 aspect-video rounded-full border bg-gradient-to-b from-blue-500/80 to-white opacity-25 blur-2xl duration-300 dark:from-white dark:to-white dark:opacity-5 dark:group-hover:opacity-10"
                />
                <div className="relative">
                  <div className="relative flex size-12 rounded-2xl border border-border shadow-sm *:relative *:m-auto *:size-6">
                    <Icon />
                  </div>
                  <h3 className="mt-2 font-bold text-xl">{feature.title}</h3>
                  <p className="mt-2 pb-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </MaxWidthWrapper>
    </section>
  );
}
