"use client";
import * as React from "react";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
type CarouselApi = UseEmblaCarouselType[1];
type CarouselProps = {
  opts?: Parameters<typeof useEmblaCarousel>[0];
  plugins?: Parameters<typeof useEmblaCarousel>[1];
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
};
const Context = React.createContext<{
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: CarouselApi;
  orientation: "horizontal" | "vertical";
} | null>(null);
function useCarousel() {
  const context = React.useContext(Context);
  if (!context) throw new Error("Carousel components need a Carousel parent");
  return context;
}
const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      plugins,
      setApi,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      { ...opts, axis: orientation === "horizontal" ? "x" : "y" },
      plugins,
    );
    React.useEffect(() => {
      if (api) setApi?.(api);
    }, [api, setApi]);
    return (
      <Context.Provider value={{ carouselRef, api, orientation }}>
        <div
          ref={ref}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          onKeyDownCapture={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              if (event.key === "ArrowLeft") api?.scrollPrev();
              else api?.scrollNext();
            }
          }}
          {...props}
        >
          {children}
        </div>
      </Context.Provider>
    );
  },
);
Carousel.displayName = "Carousel";
const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel();
  return (
    <div ref={carouselRef} style={{ overflow: "hidden" }}>
      <div
        ref={ref}
        className={cn("flex", className)}
        style={{
          display: "flex",
          flexDirection: orientation === "vertical" ? "column" : "row",
        }}
        {...props}
      />
    </div>
  );
});
CarouselContent.displayName = "CarouselContent";
const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="group"
    aria-roledescription="slide"
    className={cn("min-w-0 shrink-0 grow-0 basis-full", className)}
    {...props}
  />
));
CarouselItem.displayName = "CarouselItem";
function useCarouselBounds() {
  const { api } = useCarousel();
  const [bounds, setBounds] = React.useState({ previous: false, next: false });
  React.useEffect(() => {
    if (!api) return;
    const update = () =>
      setBounds({ previous: api.canScrollPrev(), next: api.canScrollNext() });
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);
  return bounds;
}
function CarouselPrevious(props: React.ComponentProps<typeof Button>) {
  const { api } = useCarousel();
  const bounds = useCarouselBounds();
  return (
    <Button
      disabled={!bounds.previous}
      variant="outline"
      size="icon"
      aria-label="Previous slide"
      onClick={() => api?.scrollPrev()}
      {...props}
    >
      <ArrowLeft />
    </Button>
  );
}
function CarouselNext(props: React.ComponentProps<typeof Button>) {
  const { api } = useCarousel();
  const bounds = useCarouselBounds();
  return (
    <Button
      disabled={!bounds.next}
      variant="outline"
      size="icon"
      aria-label="Next slide"
      onClick={() => api?.scrollNext()}
      {...props}
    >
      <ArrowRight />
    </Button>
  );
}
export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
