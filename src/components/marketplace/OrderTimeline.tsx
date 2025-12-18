import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  Clock,
  Truck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Package,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'returned';
  timestamp?: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface OrderTimelineProps {
  orderNumber: string;
  currentStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'returned';
  events: TimelineEvent[];
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  sellerNotes?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  onContactSeller?: () => void;
  onReturnRequest?: () => void;
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({
  orderNumber,
  currentStatus,
  events,
  estimatedDeliveryDate,
  actualDeliveryDate,
  sellerNotes,
  trackingNumber,
  trackingUrl,
  onContactSeller,
  onReturnRequest
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={20} />;
      case 'processing':
        return <Package size={20} />;
      case 'shipped':
        return <Truck size={20} />;
      case 'delivered':
        return <MapPin size={20} />;
      case 'completed':
        return <CheckCircle2 size={20} />;
      case 'cancelled':
        return <AlertCircle size={20} />;
      case 'returned':
        return <Package size={20} />;
      default:
        return <ShoppingCart size={20} />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Order Pending',
      processing: 'Processing Order',
      shipped: 'Shipped',
      delivered: 'Delivered',
      completed: 'Completed',
      cancelled: 'Cancelled',
      returned: 'Returned'
    };
    return labels[status] || 'Unknown Status';
  };

  const isCompleted = (status: string) => {
    return ['delivered', 'completed'].includes(status);
  };

  const isCancelled = status => status === 'cancelled';

  const sortedEvents = [...events].sort((a, b) => {
    const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return dateA - dateB;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Order Status</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Order #{orderNumber}</p>
          </div>
          <Badge className={getStatusColor(currentStatus)}>
            {getStatusLabel(currentStatus)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Current Status Display */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center gap-4">
            <div className={cn(
              'p-3 rounded-full',
              getStatusColor(currentStatus)
            )}>
              {getStatusIcon(currentStatus)}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-lg">
                {getStatusLabel(currentStatus)}
              </p>
              {estimatedDeliveryDate && !isCompleted(currentStatus) && (
                <p className="text-sm text-gray-600">
                  📅 Estimated delivery: {new Date(estimatedDeliveryDate).toLocaleDateString()}
                </p>
              )}
              {actualDeliveryDate && isCompleted(currentStatus) && (
                <p className="text-sm text-gray-600">
                  ✓ Delivered on: {new Date(actualDeliveryDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          <h3 className="font-semibold text-gray-900">Timeline</h3>
          <div className="relative pl-8">
            {sortedEvents.length === 0 ? (
              <p className="text-sm text-gray-600 italic">No timeline events yet</p>
            ) : (
              sortedEvents.map((event, index) => {
                const isCurrentStatus = event.status === currentStatus;
                const isPastEvent = index < sortedEvents.findIndex(e => e.status === currentStatus);

                return (
                  <div key={`${event.status}-${index}`} className="relative">
                    {/* Timeline line */}
                    {index < sortedEvents.length - 1 && (
                      <div
                        className={cn(
                          'absolute left-0 top-8 w-0.5 h-12',
                          isPastEvent || isCurrentStatus
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        )}
                      />
                    )}

                    {/* Timeline dot */}
                    <div className="absolute left-0 top-2 -translate-x-1.5">
                      <div
                        className={cn(
                          'w-4 h-4 rounded-full border-2 transition-colors',
                          isPastEvent || isCurrentStatus
                            ? 'bg-green-500 border-green-600'
                            : 'bg-white border-gray-300'
                        )}
                      />
                    </div>

                    {/* Event content */}
                    <div className="ml-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {event.label}
                        </span>
                        {isCurrentStatus && (
                          <Badge variant="secondary" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      {event.timestamp && (
                        <p className="text-sm text-gray-600">
                          {new Date(event.timestamp).toLocaleDateString()} at {new Date(event.timestamp).toLocaleTimeString()}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-sm text-gray-700 mt-1">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tracking Information */}
        {trackingNumber && !isCancelled(currentStatus) && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-gray-900 mb-3">Tracking Information</h4>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Tracking Number
                </label>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-3 py-2 rounded border text-sm font-mono flex-1">
                    {trackingNumber}
                  </code>
                  {trackingUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(trackingUrl, '_blank')}
                    >
                      Track
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seller Notes */}
        {sellerNotes && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs font-medium text-blue-900 mb-2">Seller's Note</p>
            <p className="text-sm text-blue-800">{sellerNotes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          {onContactSeller && (
            <Button
              variant="outline"
              className="gap-2 flex-1"
              onClick={onContactSeller}
            >
              <MessageCircle size={16} />
              Contact Seller
            </Button>
          )}
          {isCompleted(currentStatus) && onReturnRequest && (
            <Button
              variant="outline"
              className="gap-2 flex-1"
              onClick={onReturnRequest}
            >
              <Package size={16} />
              Return Item
            </Button>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 p-3 rounded text-xs text-blue-700 space-y-1">
          <p>ℹ️ <strong>Tip:</strong> Keep track of your order status and tracking number.</p>
          <p>📦 <strong>Delivery:</strong> Your package may arrive before or after the estimated date.</p>
          {isCompleted(currentStatus) && (
            <p>✓ <strong>Order Complete:</strong> Leave a review to help other customers!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderTimeline;
