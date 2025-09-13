import { CallToAction } from "~/components/sections/cta";
import { Features } from "~/components/sections/features";
import { HeroLanding } from "~/components/sections/hero-landing";
import { HowItWorks } from "~/components/sections/how-it-works";
import { Pricing } from "~/components/sections/pricing";
// import { Testimonials } from "~/components/sections/testimonials";

export default function LandingPage() {
  return (
    <>
      <HeroLanding />
      <Features />
      <HowItWorks />
      <Pricing />
      {/* <Testimonials /> */}
      <CallToAction />
    </>
  );
}
