import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShoppingCart,
  Heart,
  Package,
  Search,
  Star,
  TrendingUp,
  MessageSquare,
  Home,
  CheckCircle,
  AlertTriangle,
  Zap,
} from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Base empty state component
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className = "",
}) => {
  return (
    <Card className={`border-dashed ${className}`}>
      <CardContent className="pt-12 pb-12 text-center">
        <div className="flex justify-center mb-4">
          {icon && (
            <div className="text-gray-300" style={{ fontSize: "64px" }}>
              {icon}
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">{description}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          {action && (
            <Button onClick={action.onClick} className="flex items-center gap-2">
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Empty cart state
 */
export const EmptyCartState: React.FC<{
  onContinueShopping: () => void;
  onViewWishlist?: () => void;
}> = ({ onContinueShopping, onViewWishlist }) => {
  return (
    <EmptyState
      title="Your Cart is Empty"
      description="Start shopping now to discover amazing products and add them to your cart!"
      icon={<ShoppingCart className="w-16 h-16" />}
      action={{
        label: "Continue Shopping",
        onClick: onContinueShopping,
      }}
      secondaryAction={
        onViewWishlist
          ? {
              label: "View Wishlist",
              onClick: onViewWishlist,
            }
          : undefined
      }
    />
  );
};

/**
 * Empty wishlist state
 */
export const EmptyWishlistState: React.FC<{
  onBrowseProducts: () => void;
  onViewRecommendations?: () => void;
}> = ({ onBrowseProducts, onViewRecommendations }) => {
  return (
    <EmptyState
      title="Your Wishlist is Empty"
      description="Save your favorite products here! Start by adding items from the marketplace."
      icon={<Heart className="w-16 h-16" />}
      action={{
        label: "Browse Products",
        onClick: onBrowseProducts,
      }}
      secondaryAction={
        onViewRecommendations
          ? {
              label: "See Recommendations",
              onClick: onViewRecommendations,
            }
          : undefined
      }
    />
  );
};

/**
 * No orders state
 */
export const EmptyOrdersState: React.FC<{
  onStartShopping: () => void;
}> = ({ onStartShopping }) => {
  return (
    <EmptyState
      title="No Orders Yet"
      description="You haven't made any purchases yet. Start exploring and find products you love!"
      icon={<Package className="w-16 h-16" />}
      action={{
        label: "Start Shopping",
        onClick: onStartShopping,
      }}
    />
  );
};

/**
 * No search results state
 */
export const EmptySearchResultsState: React.FC<{
  query?: string;
  onClearSearch: () => void;
  onBrowseCategories?: () => void;
}> = ({ query, onClearSearch, onBrowseCategories }) => {
  return (
    <EmptyState
      title="No Results Found"
      description={`We couldn't find any products matching "${query}". Try different keywords or browse our categories.`}
      icon={<Search className="w-16 h-16" />}
      action={{
        label: "Clear Search",
        onClick: onClearSearch,
      }}
      secondaryAction={
        onBrowseCategories
          ? {
              label: "Browse Categories",
              onClick: onBrowseCategories,
            }
          : undefined
      }
    />
  );
};

/**
 * No reviews state
 */
export const EmptyReviewsState: React.FC<{
  onLeaveReview: () => void;
}> = ({ onLeaveReview }) => {
  return (
    <EmptyState
      title="No Reviews Yet"
      description="Be the first to review this product! Share your experience with other shoppers."
      icon={<Star className="w-16 h-16" />}
      action={{
        label: "Leave a Review",
        onClick: onLeaveReview,
      }}
    />
  );
};

/**
 * No Q&A state
 */
export const EmptyQAState: React.FC<{
  onAskQuestion: () => void;
}> = ({ onAskQuestion }) => {
  return (
    <EmptyState
      title="No Questions Yet"
      description="Have a question about this product? Be the first to ask!"
      icon={<MessageSquare className="w-16 h-16" />}
      action={{
        label: "Ask a Question",
        onClick: onAskQuestion,
      }}
    />
  );
};

/**
 * No sales state (for sellers)
 */
export const NoSalesState: React.FC<{
  onListProduct: () => void;
  onOptimizeProducts?: () => void;
}> = ({ onListProduct, onOptimizeProducts }) => {
  return (
    <EmptyState
      title="No Sales Yet"
      description="Start selling! List your products in the marketplace and begin earning."
      icon={<TrendingUp className="w-16 h-16" />}
      action={{
        label: "List Your First Product",
        onClick: onListProduct,
      }}
      secondaryAction={
        onOptimizeProducts
          ? {
              label: "Optimize Products",
              onClick: onOptimizeProducts,
            }
          : undefined
      }
    />
  );
};

/**
 * No inventory state
 */
export const NoInventoryState: React.FC<{
  onRestockItems: () => void;
}> = ({ onRestockItems }) => {
  return (
    <EmptyState
      title="Inventory Empty"
      description="All products are out of stock. Add new inventory to continue selling."
      icon={<Package className="w-16 h-16" />}
      action={{
        label: "Restock Items",
        onClick: onRestockItems,
      }}
    />
  );
};

/**
 * Order delivered state
 */
export const OrderDeliveredEmptyState: React.FC<{
  onContinueShopping: () => void;
  onViewOrders?: () => void;
}> = ({ onContinueShopping, onViewOrders }) => {
  return (
    <EmptyState
      title="Order Delivered!"
      description="Thank you for your purchase. Your order has been successfully delivered."
      icon={<CheckCircle className="w-16 h-16 text-green-500" />}
      action={{
        label: "Continue Shopping",
        onClick: onContinueShopping,
      }}
      secondaryAction={
        onViewOrders
          ? {
              label: "View Orders",
              onClick: onViewOrders,
            }
          : undefined
      }
    />
  );
};

/**
 * No messages state
 */
export const EmptyMessagesState: React.FC<{
  onStartChat: () => void;
}> = ({ onStartChat }) => {
  return (
    <EmptyState
      title="No Messages"
      description="Start a conversation with sellers or buyers to discuss products and orders."
      icon={<MessageSquare className="w-16 h-16" />}
      action={{
        label: "Start a Chat",
        onClick: onStartChat,
      }}
    />
  );
};

/**
 * No notifications state
 */
export const EmptyNotificationsState: React.FC = () => {
  return (
    <EmptyState
      title="No Notifications"
      description="You're all caught up! Check back later for updates on your orders and activities."
      icon={<Zap className="w-16 h-16" />}
    />
  );
};

/**
 * Connection error state
 */
export const ConnectionErrorState: React.FC<{
  onRetry: () => void;
}> = ({ onRetry }) => {
  return (
    <EmptyState
      title="Connection Error"
      description="Something went wrong while loading. Please check your internet connection and try again."
      icon={<AlertTriangle className="w-16 h-16 text-red-500" />}
      action={{
        label: "Retry",
        onClick: onRetry,
      }}
    />
  );
};

/**
 * No dashboard data state
 */
export const NoDashboardDataState: React.FC<{
  title: string;
  description: string;
  onAction: () => void;
  actionLabel: string;
}> = ({ title, description, onAction, actionLabel }) => {
  return (
    <EmptyState
      title={title}
      description={description}
      icon={<Home className="w-16 h-16" />}
      action={{
        label: actionLabel,
        onClick: onAction,
      }}
    />
  );
};

/**
 * No addresses state (for checkout)
 */
export const EmptyAddressesState: React.FC<{
  onAddAddress: () => void;
}> = ({ onAddAddress }) => {
  return (
    <EmptyState
      title="No Addresses on File"
      description="Add a delivery address to proceed with checkout."
      icon={<Home className="w-16 h-16" />}
      action={{
        label: "Add Address",
        onClick: onAddAddress,
      }}
    />
  );
};

/**
 * No payment methods state (for checkout)
 */
export const EmptyPaymentMethodsState: React.FC<{
  onAddPaymentMethod: () => void;
}> = ({ onAddPaymentMethod }) => {
  return (
    <EmptyState
      title="No Payment Methods"
      description="Add a payment method to complete your purchase."
      icon={<ShoppingCart className="w-16 h-16" />}
      action={{
        label: "Add Payment Method",
        onClick: onAddPaymentMethod,
      }}
    />
  );
};

/**
 * Large empty state for full-page views
 */
export const LargeEmptyState: React.FC<
  EmptyStateProps & { iconSize?: "small" | "large" }
> = ({
  title,
  description,
  icon,
  action,
  secondaryAction,
  iconSize = "large",
  className = "",
}) => {
  const iconSizeClass = iconSize === "large" ? "w-24 h-24" : "w-16 h-16";

  return (
    <div
      className={`flex flex-col items-center justify-center py-20 ${className}`}
    >
      {icon && (
        <div className={`text-gray-300 mb-6 ${iconSizeClass}`}>{icon}</div>
      )}
      <h2 className="text-3xl font-bold mb-2 text-gray-900">{title}</h2>
      <p className="text-gray-600 mb-8 max-w-md text-center text-lg">
        {description}
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        {action && (
          <Button size="lg" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button size="lg" variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};
