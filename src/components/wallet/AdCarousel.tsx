import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  backgroundColor?: string;
  textColor?: string;
  ctaText?: string;
  ctaUrl?: string;
  isActive: boolean;
  createdAt: Date;
}

interface AdCarouselProps {
  ads?: Ad[];
  autoScroll?: boolean;
  scrollInterval?: number;
  onAdClick?: (ad: Ad) => void;
}

const DEFAULT_ADS: Ad[] = [
  {
    id: "1",
    title: "Premium Features",
    description: "Unlock advanced wallet features",
    imageUrl: "https://images.unsplash.com/photo-1579621970563-430f63602022?w=800&h=200&fit=crop",
    backgroundColor: "#FF6B6B",
    textColor: "#FFFFFF",
    ctaText: "Learn More",
    ctaUrl: "/app/premium",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "2",
    title: "Save More",
    description: "Get cashback on every transaction",
    imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=200&fit=crop",
    backgroundColor: "#4ECDC4",
    textColor: "#FFFFFF",
    ctaText: "Explore",
    ctaUrl: "/app/rewards",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "3",
    title: "Invest Smartly",
    description: "Start your investment journey today",
    imageUrl: "https://images.unsplash.com/photo-1526628653514-7524971f64b8?w=800&h=200&fit=crop",
    backgroundColor: "#95E1D3",
    textColor: "#1A1A1A",
    ctaText: "Start Now",
    ctaUrl: "/app/crypto",
    isActive: true,
    createdAt: new Date(),
  },
];

const AdCarousel = ({
  ads = DEFAULT_ADS,
  autoScroll = true,
  scrollInterval = 5000,
  onAdClick,
}: AdCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleAds, setVisibleAds] = useState<Ad[]>([]);
  const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter active ads
  useEffect(() => {
    const activeAds = ads.filter((ad) => ad.isActive);
    setVisibleAds(activeAds.length > 0 ? activeAds : DEFAULT_ADS);
  }, [ads]);

  // Auto scroll effect
  useEffect(() => {
    if (!autoScroll || visibleAds.length === 0) return;

    const startAutoScroll = () => {
      autoScrollTimer.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % visibleAds.length);
      }, scrollInterval);
    };

    startAutoScroll();

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [autoScroll, scrollInterval, visibleAds.length]);

  const handlePrev = () => {
    if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    setCurrentIndex((prev) => (prev - 1 + visibleAds.length) % visibleAds.length);
  };

  const handleNext = () => {
    if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    setCurrentIndex((prev) => (prev + 1) % visibleAds.length);
  };

  const handleAdClick = (ad: Ad) => {
    if (onAdClick) {
      onAdClick(ad);
    } else if (ad.ctaUrl) {
      window.location.href = ad.ctaUrl;
    }
  };

  if (visibleAds.length === 0) {
    return null;
  }

  const currentAd = visibleAds[currentIndex];

  return (
    <div ref={containerRef} className="relative w-full h-40 md:h-48 lg:h-56 overflow-hidden group bg-gradient-to-b from-[#FF6B6B] to-[#FF6B6B]">
      {/* Ad Carousel Container */}
      <div className="relative w-full h-full">
        {/* Ad Slide */}
        <div
          className="w-full h-full transition-all duration-500 ease-out"
          style={{
            backgroundColor: currentAd.backgroundColor || "#8B5CF6",
          }}
        >
          {/* Background Image */}
          {currentAd.imageUrl && (
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `url(${currentAd.imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}

          {/* Content */}
          <div className="relative z-10 h-full p-6 md:p-8 lg:p-12 flex flex-col justify-between text-left">
            <div className="space-y-2 md:space-y-3">
              <h3
                className="text-lg md:text-2xl lg:text-3xl font-bold"
                style={{ color: currentAd.textColor || "#FFFFFF" }}
              >
                {currentAd.title}
              </h3>
              <p
                className="text-sm md:text-base lg:text-lg opacity-90"
                style={{ color: currentAd.textColor || "#FFFFFF" }}
              >
                {currentAd.description}
              </p>
            </div>

            {currentAd.ctaText && (
              <button
                onClick={() => handleAdClick(currentAd)}
                className="self-start px-4 md:px-6 py-2 md:py-3 bg-white/20 backdrop-blur-sm rounded-lg text-sm md:text-base font-semibold hover:bg-white/30 transition-all"
                style={{ color: currentAd.textColor || "#FFFFFF" }}
              >
                {currentAd.ctaText}
              </button>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        {visibleAds.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-2 md:p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
              aria-label="Previous ad"
            >
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-2 md:p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
              aria-label="Next ad"
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {visibleAds.length > 1 && (
          <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 md:gap-2.5">
            {visibleAds.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-white h-2.5 w-6 md:h-3 md:w-8"
                    : "bg-white/50 h-2.5 w-2.5 md:h-3 md:w-3 hover:bg-white/70"
                }`}
                aria-label={`Go to ad ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdCarousel;
