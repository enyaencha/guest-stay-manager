import { useRef } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// Import suite images
import presidentialSuite from "@/assets/suites/presidential-suite.jpg";
import oceanSuite from "@/assets/suites/ocean-suite.jpg";
import penthouseLiving from "@/assets/suites/penthouse-living.jpg";
import spaBathroom from "@/assets/suites/spa-bathroom.jpg";
import honeymoonSuite from "@/assets/suites/honeymoon-suite.jpg";
import executiveSuite from "@/assets/suites/executive-suite.jpg";
import gardenSuite from "@/assets/suites/garden-suite.jpg";

interface Suite {
  id: string;
  name: string;
  image: string;
  tagline: string;
}

const suites: Suite[] = [
  {
    id: "presidential",
    name: "Presidential Suite",
    image: presidentialSuite,
    tagline: "The Pinnacle of Luxury",
  },
  {
    id: "ocean",
    name: "Ocean View Suite",
    image: oceanSuite,
    tagline: "Wake Up to Paradise",
  },
  {
    id: "penthouse",
    name: "Penthouse Living",
    image: penthouseLiving,
    tagline: "Skyline Serenity",
  },
  {
    id: "spa",
    name: "Spa Retreat",
    image: spaBathroom,
    tagline: "Rejuvenate Your Soul",
  },
  {
    id: "honeymoon",
    name: "Honeymoon Suite",
    image: honeymoonSuite,
    tagline: "Romance Redefined",
  },
  {
    id: "executive",
    name: "Executive Suite",
    image: executiveSuite,
    tagline: "Business Meets Elegance",
  },
  {
    id: "garden",
    name: "Garden Terrace",
    image: gardenSuite,
    tagline: "Nature's Embrace",
  },
];

interface FeaturedSuitesGalleryProps {
  onBookNow?: () => void;
}

export function FeaturedSuitesGallery({ onBookNow }: FeaturedSuitesGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 340;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-16 bg-gradient-to-b from-secondary/30 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Featured Suites
              </h2>
              <p className="text-sm text-muted-foreground">
                Discover our signature luxury accommodations
              </p>
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              className="rounded-full border-accent/30 hover:bg-accent/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              className="rounded-full border-accent/30 hover:bg-accent/10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Gallery Strip */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {suites.map((suite) => (
            <div
              key={suite.id}
              className="flex-shrink-0 w-[300px] md:w-[320px] snap-start group cursor-pointer"
              onClick={onBookNow}
            >
              <div className="relative h-[220px] rounded-xl overflow-hidden shadow-lg">
                <img
                  src={suite.image}
                  alt={suite.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {suite.name}
                  </h3>
                  <p className="text-sm text-white/80 italic">
                    "{suite.tagline}"
                  </p>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="px-4 py-2 bg-white/90 text-primary font-medium rounded-full text-sm shadow-lg">
                    View & Book
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Navigation Dots */}
        <div className="flex justify-center gap-2 mt-4 sm:hidden">
          {suites.slice(0, 4).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-accent/30"
            />
          ))}
        </div>
      </div>
    </section>
  );
}