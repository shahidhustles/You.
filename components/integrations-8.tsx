import {
  Gemini,
  NextJS,
  Vercel,
  Vapi,
  Convex,
  Clerk,
} from "@/components/logos";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function IntegrationsSection() {
  return (
    <section id="tech-stack">
      <div className="bg-muted dark:bg-background py-24 md:py-32">
        <div className="mx-auto flex flex-col px-6 md:grid md:max-w-5xl md:grid-cols-2 md:gap-12">
          <div className="order-last mt-6 flex flex-col gap-12 md:order-first">
            <div className="space-y-6">
              <h2 className="text-balance text-3xl font-semibold md:text-4xl lg:text-5xl">
                Powered by cutting-edge technology
              </h2>
              <p className="text-muted-foreground">
                Built with the most advanced AI and development tools to deliver
                seamless mental health support that scales with your journey.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/onboarding">Start Your Journey</Link>
              </Button>
            </div>

            <div className="mt-auto grid grid-cols-[auto_1fr] gap-3">
              <div className="bg-background flex aspect-square items-center justify-center border rounded-lg">
                <Gemini className="size-9" />
              </div>
              <blockquote>
                <p>
                  &ldquo;The fusion of AI voice technology with mental health
                  care represents the future of accessible, personalized therapy
                  for everyone.&rdquo;
                </p>
                <div className="mt-2 flex gap-2 text-sm">
                  <cite>Dr. Sarah Johnson</cite>
                  <p className="text-muted-foreground">
                    AI Researcher, Mental Health Institute
                  </p>
                </div>
              </blockquote>
            </div>
          </div>

          <div className="-mx-6 px-6 [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_70%,transparent_100%)] sm:mx-auto sm:max-w-md md:-mx-6 md:ml-auto md:mr-0">
            <div className="bg-background dark:bg-muted/50 rounded-2xl border p-3 shadow-lg md:pb-12">
              <div className="grid grid-cols-2 gap-2">
                <Integration
                  icon={<NextJS />}
                  name="Next.js"
                  description="Full-stack React framework powering our lightning-fast web application."
                />
                <Integration
                  icon={<Vercel />}
                  name="Vercel AI SDK"
                  description="Advanced AI toolkit for seamless integration of language models."
                />
                <Integration
                  icon={<Vapi />}
                  name="Vapi"
                  description="Voice AI platform enabling natural conversational therapy sessions."
                />
                <Integration
                  icon={<Gemini />}
                  name="Gemini"
                  description="Google's most capable AI model for understanding and support."
                />
                <Integration
                  icon={<Convex />}
                  name="Convex"
                  description="Real-time database ensuring your progress is always synchronized."
                />
                <Integration
                  icon={<Clerk />}
                  name="Clerk"
                  description="Secure authentication system protecting your personal data."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const Integration = ({
  icon,
  name,
  description,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
}) => {
  return (
    <div className="hover:bg-muted dark:hover:bg-muted/50 space-y-4 rounded-lg border p-4 transition-colors">
      <div className="flex size-fit items-center justify-center">{icon}</div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium">{name}</h3>
        <p className="text-muted-foreground line-clamp-1 text-sm md:line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  );
};
