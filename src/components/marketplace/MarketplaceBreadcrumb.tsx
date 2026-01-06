import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface MarketplaceBreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const MarketplaceBreadcrumb: React.FC<MarketplaceBreadcrumbProps> = ({
  items,
  className = '',
}) => {
  const location = useLocation();

  // Auto-generate breadcrumbs from pathname if items not provided
  const getAutoBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname;

    // Extract marketplace path segments
    const segments = path
      .replace(/^\/app\//, '')
      .split('/')
      .filter(Boolean);

    if (!segments[0]?.includes('marketplace')) {
      return [];
    }

    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Marketplace', href: '/app/marketplace' },
    ];

    // Build breadcrumbs based on path
    if (segments[1] === 'product' && segments[2]) {
      breadcrumbs.push({ label: 'Products', href: '/app/marketplace' });
      breadcrumbs.push({ label: `Product ${segments[2]}` }); // Current page, no href
    } else if (segments[1] === 'orders') {
      breadcrumbs.push({ label: 'My Orders' });
    } else if (segments[1] === 'wishlist') {
      breadcrumbs.push({ label: 'Wishlist' });
    } else if (segments[1] === 'my') {
      breadcrumbs.push({ label: 'Dashboard' });
    } else if (segments[1] === 'sell') {
      breadcrumbs.push({ label: 'Sell Items' });
    } else if (segments[1] === 'cart') {
      breadcrumbs.push({ label: 'Shopping Cart' });
    } else if (segments[1] === 'checkout') {
      breadcrumbs.push({ label: 'Shopping Cart', href: '/app/marketplace/cart' });
      breadcrumbs.push({ label: 'Checkout' });
    } else if (segments[1] === 'seller' && segments[2]) {
      breadcrumbs.push({ label: 'Seller', href: '/app/marketplace/seller' });
      breadcrumbs.push({ label: `Store ${segments[2]}` });
    }

    return breadcrumbs;
  };

  const breadcrumbItems = items || getAutoBreadcrumbs();

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <div className={`mb-4 ${className}`}>
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;

            return (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  {item.href && !isLast ? (
                    <BreadcrumbLink asChild>
                      <Link
                        to={item.href}
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        {item.label}
                      </Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className={isLast ? 'font-semibold text-gray-900' : ''}>
                      {item.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>

                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};

export default MarketplaceBreadcrumb;
