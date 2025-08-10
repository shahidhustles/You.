import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

export default function LogoCloud() {
  return (
    <section className="bg-background overflow-hidden py-16">
      <div className="group relative m-auto max-w-7xl px-6">
        <div className="flex flex-col items-center md:flex-row">
          <div className="md:max-w-44 md:border-r md:pr-6">
            <p className="text-end text-sm">Trusted by amazing people</p>
          </div>
          <div className="relative py-6 md:w-[calc(100%-11rem)]">
            <InfiniteSlider speedOnHover={20} speed={40} gap={112}>
              <div className="flex items-center justify-center h-12">
                <span className="text-lg font-semibold text-zinc-600 dark:text-zinc-400">
                  My Mom
                </span>
              </div>

              <div className="flex items-center justify-center h-12">
                <span className="text-lg font-semibold text-zinc-600 dark:text-zinc-400">
                  My Sister
                </span>
                <span className="text-xs text-zinc-500 ml-2">
                  (Licensed Psychologist)
                </span>
              </div>

              <div className="flex items-center justify-center h-12">
                <span className="text-lg font-semibold text-zinc-600 dark:text-zinc-400">
                  Me
                </span>
                <span className="text-xs text-zinc-500 ml-2">
                  (ofc)
                </span>
              </div>

              <div className="flex items-center justify-center h-12">
                <span className="text-lg font-semibold text-zinc-600 dark:text-zinc-400">
                  My Therapist
                </span>
               <span className="text-xs text-zinc-500 ml-2">
                  (Imaginary)
                </span>
              </div>

              <div className="flex items-center justify-center h-12">
                <span className="text-lg font-semibold text-zinc-600 dark:text-zinc-400">
                  My Dog Walker
                </span>
                <span className="text-xs text-zinc-500 ml-2">
                  (Me Again)
                </span>
              </div>

              <div className="flex items-center justify-center h-12">
                <span className="text-lg font-semibold text-zinc-600 dark:text-zinc-400">
                  Random Person
                </span>
              </div>

              <div className="flex items-center justify-center h-12">
                <span className="text-lg font-semibold text-zinc-600 dark:text-zinc-400">
                  My Neighbor
                </span>
              </div>

              <div className="flex items-center justify-center h-12">
                <span className="text-lg font-semibold text-zinc-600 dark:text-zinc-400">
                  Zoe (My Cat)
                </span>
              </div>
            </InfiniteSlider>

            <div className="bg-linear-to-r from-background absolute inset-y-0 left-0 w-20"></div>
            <div className="bg-linear-to-l from-background absolute inset-y-0 right-0 w-20"></div>
            <ProgressiveBlur
              className="pointer-events-none absolute left-0 top-0 h-full w-20"
              direction="left"
              blurIntensity={1}
            />
            <ProgressiveBlur
              className="pointer-events-none absolute right-0 top-0 h-full w-20"
              direction="right"
              blurIntensity={1}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
