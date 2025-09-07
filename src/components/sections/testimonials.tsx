import { Card, CardContent } from "~/components/ui/card";

export function Testimonials() {
  return (
    <section id="testimonials" className="px-4 py-20">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-bold text-3xl md:text-4xl">
            Trusted by Creators
          </h2>
          <p className="text-muted-foreground text-xl">
            See what our users are saying
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              {/* <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div> */}
              <p className="mb-4 text-muted-foreground">
                "Finally, a solution that works with my local bank. My
                newsletter subscribers love the seamless experience."
              </p>
              <div className="flex items-center">
                <div className="mr-3 h-10 w-10 rounded-full bg-muted"></div>
                <div>
                  <div className="font-semibold">
                    [TESTIMONIAL — AMARA, NEWSLETTER CREATOR]
                  </div>
                  <div className="text-muted-foreground text-sm">
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
              <p className="mb-4 text-muted-foreground">
                "The Kit integration is perfect. My paying subscribers are
                automatically tagged and segmented."
              </p>
              <div className="flex items-center">
                <div className="mr-3 h-10 w-10 rounded-full bg-muted"></div>
                <div>
                  <div className="font-semibold">
                    [TESTIMONIAL — KWAME, PODCASTER]
                  </div>
                  <div className="text-muted-foreground text-sm">
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
              <p className="mb-4 text-muted-foreground">
                "Setup took less than 10 minutes. Now I focus on creating
                content while payments handle themselves."
              </p>
              <div className="flex items-center">
                <div className="mr-3 h-10 w-10 rounded-full bg-muted"></div>
                <div>
                  <div className="font-semibold">
                    [TESTIMONIAL — THANDIWE, WRITER]
                  </div>
                  <div className="text-muted-foreground text-sm">
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
