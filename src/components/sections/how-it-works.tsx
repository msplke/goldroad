export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground">
            Three simple steps to start earning
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold mb-3">
              Connect Your Accounts
            </h3>
            <p className="text-muted-foreground">
              Link your Paystack and ConvertKit accounts in minutes
            </p>
          </div>
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold mb-3">Set Your Pricing</h3>
            <p className="text-muted-foreground">
              Create subscription tiers for your content or services
            </p>
          </div>
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold mb-3">Start Earning</h3>
            <p className="text-muted-foreground">
              Share your payment link and watch subscribers grow
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
