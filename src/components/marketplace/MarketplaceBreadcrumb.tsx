import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface MarketplaceBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const MarketplaceBreadcrumb: React.FC<MarketplaceBreadcrumbProps> = ({
  items,
  className,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <nav
      className={cn(
        "flex items-center gap-1 px-4 py-3 text-sm text-muted-foreground bg-background/50 border-b",
        className
      )}
      aria-label="Breadcrumb"
    >
      {/* Home link */}
      <Link
        to="/app/marketplace"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        aria-label="Marketplace home"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Marketplace</span>
      </Link>

      {/* Breadcrumb items */}
      {items.map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          {item.href && !item.active ? (
            <Link
              to={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={cn(
                item.active && "text-foreground font-medium"
              )}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default MarketplaceBreadcrumb;
