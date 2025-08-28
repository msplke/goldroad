import { Card, CardContent } from "~/components/ui/card";

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by Creators
          </h2>
          <p className="text-xl text-muted-foreground">
            See what our users are saying
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              {/* <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div> */}
              <p className="text-muted-foreground mb-4">
                "Finally, a solution that works with my local bank. My
                newsletter subscribers love the seamless experience."
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-muted mr-3"></div>
                <div>
                  <div className="font-semibold">
                    [TESTIMONIAL — AMARA, NEWSLETTER CREATOR]
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Lagos, Nigeria
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              {/* <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div> */}
              <p className="text-muted-foreground mb-4">
                "The ConvertKit integration is perfect. My paying subscribers
                are automatically tagged and segmented."
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-muted mr-3"></div>
                <div>
                  <div className="font-semibold">
                    [TESTIMONIAL — KWAME, PODCASTER]
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Accra, Ghana
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              {/* <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div> */}
              <p className="text-muted-foreground mb-4">
                "Setup took less than 10 minutes. Now I focus on creating
                content while payments handle themselves."
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-muted mr-3"></div>
                <div>
                  <div className="font-semibold">
                    [TESTIMONIAL — THANDIWE, WRITER]
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Cape Town, South Africa
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
