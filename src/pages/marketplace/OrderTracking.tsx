import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Truck,
  MapPin,
  Calendar,
  DollarSign,
  MessageCircle,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  Home,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { OrderService } from '@/services/orderService';
import OrderTimeline from '@/components/marketplace/OrderTimeline';
import ReturnsService from '@/services/returnsService';
import type { Order } from '@/types/enhanced-marketplace';

const OrderTracking: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tracking');
  const [returnEligibility, setReturnEligibility] = useState<any>(null);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId || !user?.id) return;

      try {
        setLoading(true);
        const fetchedOrder = await OrderService.getUserOrders(user.id);
        const currentOrder = fetchedOrder.find((o) => o.id === orderId);

        if (!currentOrder) {
          toast({
            title: 'Order Not Found',
            description: 'The order you are looking for does not exist',
            variant: 'destructive',
          });
          navigate('/marketplace/orders');
          return;
        }

        setOrder(currentOrder);

        // Check return eligibility
        const eligibility = await ReturnsService.validateReturnEligibility(
          orderId,
          user.id
        );
        setReturnEligibility(eligibility);
      } catch (error) {
        console.error('Error loading order:', error);
        toast({
          title: 'Error',
          description: 'Failed to load order details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId, user?.id, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Order not found. Please check your order number.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => navigate('/marketplace/orders')}
              className="w-full mt-4"
            >
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <Home className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: 'Pending Payment',
      confirmed: 'Order Confirmed',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  return (
    <>
      <Helmet>
        <title>{`Order Tracking - ${order.orderNumber}`}</title>
        <meta name="description" content="Track your order status and delivery" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/marketplace/orders')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
            <h1 className="text-3xl font-bold">Order Tracking</h1>
            <p className="text-muted-foreground">Order {order.orderNumber}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Order Status Summary */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{order.orderNumber}</CardTitle>
                  <CardDescription>
                    Ordered on{' '}
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </CardDescription>
                </div>
                <Badge className={cn('gap-1', getStatusColor(order.status))}>
                  {getStatusIcon(order.status)}
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-semibold">
                    ${order.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Items</p>
                  <p className="text-lg font-semibold">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                  </p>
                </div>
                {order.estimatedDelivery && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Estimated Delivery
                    </p>
                    <p className="text-lg font-semibold">
                      {new Date(order.estimatedDelivery).toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                        }
                      )}
                    </p>
                  </div>
                )}
                {order.actualDelivery && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Delivered</p>
                    <p className="text-lg font-semibold">
                      {new Date(order.actualDelivery).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tracking">Tracking</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="returns">Returns</TabsTrigger>
            </TabsList>

            {/* Tracking Tab */}
            <TabsContent value="tracking" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Order Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderTimeline order={order} />
                </CardContent>
              </Card>

              {/* Shipping Info */}
              {order.requiresShipping && order.shippingAddress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Delivery Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2">
                      <p className="font-medium">{order.shippingAddress.fullName}</p>
                      <p className="text-muted-foreground">
                        {order.shippingAddress.addressLine1}
                        {order.shippingAddress.addressLine2 &&
                          `, ${order.shippingAddress.addressLine2}`}
                      </p>
                      <p className="text-muted-foreground">
                        {order.shippingAddress.city},{' '}
                        {order.shippingAddress.state}{' '}
                        {order.shippingAddress.postalCode}
                      </p>
                      <p className="text-muted-foreground">
                        {order.shippingAddress.country}
                      </p>
                      {order.shippingAddress.phone && (
                        <p className="text-muted-foreground">
                          {order.shippingAddress.phone}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tracking Number */}
              {order.trackingNumber && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tracking Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Tracking Number
                        </p>
                        <p className="font-mono text-sm">{order.trackingNumber}</p>
                      </div>
                      {order.trackingUrl && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            window.open(order.trackingUrl, '_blank')
                          }
                        >
                          Track Package on Carrier Website
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Items Tab */}
            <TabsContent value="items" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity}
                          </p>
                          <p className="text-sm font-semibold mt-2">
                            ${item.totalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${order.subtotal.toFixed(2)}</span>
                    </div>
                    {order.discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Discount
                          {order.discountCode && ` (${order.discountCode})`}
                        </span>
                        <span className="text-green-600">
                          -${order.discountAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>
                        {order.shippingCost === 0 ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          `$${order.shippingCost.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>${order.taxAmount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Returns Tab */}
            <TabsContent value="returns" className="space-y-4">
              {returnEligibility?.eligible ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Return This Order</CardTitle>
                    <CardDescription>
                      {returnEligibility.daysRemaining} days remaining to request a return
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() =>
                        navigate(`/marketplace/returns/create/${order.id}`)
                      }
                      className="w-full"
                    >
                      Start Return Request
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Return Not Available</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {returnEligibility?.reason ||
                          'This order is not eligible for return'}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Contact Seller */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() =>
                  navigate(`/chat`, {
                    state: { orderId: order.id, sellerId: order.sellerId },
                  })
                }
              >
                <MessageCircle className="h-4 w-4" />
                Contact Seller
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default OrderTracking;
