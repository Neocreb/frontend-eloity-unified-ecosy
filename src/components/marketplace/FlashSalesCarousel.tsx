import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Zap } from 'lucide-react';
import { FlashSalesService, FlashSaleWithCountdown } from '@/services/flashSalesService';

interface FlashSalesCarouselProps {
  onSaleClick?: (saleId: string) => void;
  maxItems?: number;
}

export default function FlashSalesCarousel({ onSaleClick, maxItems = 5 }: FlashSalesCarouselProps) {
  const [activeFlashSales, setActiveFlashSales] = useState<FlashSaleWithCountdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdowns, setCountdowns] = useState<any>({});

  useEffect(() => {
    loadActiveFlashSales();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFlashSales(prev => 
        prev.map(sale => ({
          ...sale,
          timeRemaining: calculateTimeRemaining(sale.endDate)
        }))
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadActiveFlashSales = async () => {
    try {
      setLoading(true);
      const sales = await FlashSalesService.getActiveFlashSales();
      setActiveFlashSales(sales.slice(0, maxItems));
    } catch (error) {
      console.error('Error loading flash sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.max(0, end.getTime() - now.getTime());
    const totalSeconds = Math.floor(diff / 1000);

    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
      totalSeconds,
      isActive: totalSeconds > 0,
    };
  };

  const formatCountdown = (timeRemaining: any) => {
    if (!timeRemaining.isActive) return 'Sale Ended';
    if (timeRemaining.days > 0) {
      return `${timeRemaining.days}d ${timeRemaining.hours}h left`;
    }
    if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m left`;
    }
    if (timeRemaining.minutes > 0) {
      return `${timeRemaining.minutes}m left`;
    }
    return `${timeRemaining.seconds}s left`;
  };

  const formatSavings = (sale: FlashSaleWithCountdown) => {
    if (sale.discountType === 'percentage') {
      return `Save up to ${sale.discountValue}%`;
    } else {
      return `Save up to $${sale.discountValue}`;
    }
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => prev === 0 ? activeFlashSales.length - 1 : prev - 1);
  };

  const handleNext = () => {
    setCurrentIndex(prev => prev === activeFlashSales.length - 1 ? 0 : prev + 1);
  };

  if (loading || activeFlashSales.length === 0) {
    return null;
  }

  const displayedSale = activeFlashSales[currentIndex];

  return (
    <div className="relative bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg overflow-hidden border border-primary/20">
      {/* Flash Sale Card */}
      <div className="relative p-6 md:p-8">
        {/* Background pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full -ml-12 -mb-12"></div>

        {/* Content */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            {/* Flash Sale Badge */}
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-orange-500 fill-orange-500" />
              <span className="text-sm font-semibold text-orange-600">FLASH SALE</span>
            </div>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 max-w-xs">
              {displayedSale.title}
            </h2>

            {/* Description */}
            {displayedSale.description && (
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                {displayedSale.description}
              </p>
            )}

            {/* Discount Display */}
            <div className="flex items-baseline gap-2 mb-4">
              <div className="text-4xl font-bold text-primary">
                {displayedSale.discountValue}{displayedSale.discountType === 'percentage' ? '%' : '$'}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatSavings(displayedSale)}
              </div>
            </div>

            {/* Conditions */}
            {displayedSale.minOrderAmount && (
              <p className="text-xs text-muted-foreground mb-4">
                Minimum order: ${displayedSale.minOrderAmount}
              </p>
            )}

            {/* Countdown Timer */}
            <div className="flex items-center gap-2 p-3 bg-background rounded-md inline-block">
              <Clock className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Time remaining</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatCountdown(displayedSale.timeRemaining)}
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => onSaleClick?.(displayedSale.id)}
            className="hidden md:flex flex-col items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold whitespace-nowrap"
          >
            <span>Shop Sale</span>
            <span className="text-sm font-normal opacity-90">Limited Time</span>
          </button>
        </div>

        {/* Mobile CTA */}
        <button
          onClick={() => onSaleClick?.(displayedSale.id)}
          className="md:hidden w-full mt-6 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
        >
          Shop Sale Now
        </button>
      </div>

      {/* Navigation */}
      {activeFlashSales.length > 1 && (
        <div className="flex justify-between items-center px-4 py-3 bg-background/50 border-t border-border">
          <button
            onClick={handlePrevious}
            className="p-2 hover:bg-background rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          {/* Indicators */}
          <div className="flex gap-2">
            {activeFlashSales.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-primary' : 'bg-border'
                }`}
                aria-label={`Go to sale ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="p-2 hover:bg-background rounded-md transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      )}

      {/* Sale Count */}
      <div className="absolute top-4 right-4 text-xs bg-primary/90 text-primary-foreground px-2 py-1 rounded-md">
        {currentIndex + 1} / {activeFlashSales.length}
      </div>
    </div>
  );
}
