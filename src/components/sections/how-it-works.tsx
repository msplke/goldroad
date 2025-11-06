export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-20">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-bold text-3xl md:text-4xl">How It Works</h2>
          <p className="text-muted-foreground text-xl">
            Three simple steps to start earning
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary font-bold text-2xl text-primary-foreground">
              1
            </div>
            <h3 className="mb-3 font-semibold text-xl">Connect Your Account</h3>
            <p className="text-muted-foreground">
              Set up the account you'd like us to route payments to
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary font-bold text-2xl text-primary-foreground">
              2
            </div>
            <h3 className="mb-3 font-semibold text-xl">Set Your Pricing</h3>
            <p className="text-muted-foreground">
              Create subscription tiers for your content or services
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary font-bold text-2xl text-primary-foreground">
              3
            </div>
            <h3 className="mb-3 font-semibold text-xl">Start Earning</h3>
            <p className="text-muted-foreground">
              Share your payment link and watch subscribers grow
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
