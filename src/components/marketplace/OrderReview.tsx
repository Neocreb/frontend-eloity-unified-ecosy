import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  PackageOpen,
  Check,
  AlertCircle,
  ShoppingCart,
  Truck,
  Lock,
  DollarSign,
} from 'lucide-react';
import { CartItem, Address, PaymentMethod } from '@/types/marketplace';
import { cn } from '@/lib/utils';

interface OrderReviewProps {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount?: number;
  discountCode?: string;
  shippingAddress?: Address;
  shippingMethod?: { name: string; cost: number };
  paymentMethod?: PaymentMethod;
  agreesToTerms: boolean;
  onAgreesToTermsChange: (value: boolean) => void;
  onEditCart?: () => void;
  onEditAddress?: () => void;
  onEditShipping?: () => void;
  onEditPayment?: () => void;
  onPlaceOrder?: () => void;
  isProcessing?: boolean;
  isValid?: boolean;
}

export default function OrderReview({
  items,
  subtotal,
  shippingCost,
  taxAmount,
  discountAmount = 0,
  discountCode,
  shippingAddress,
  shippingMethod,
  paymentMethod,
  agreesToTerms,
  onAgreesToTermsChange,
  onEditCart,
  onEditAddress,
  onEditShipping,
  onEditPayment,
  onPlaceOrder,
  isProcessing = false,
  isValid = true,
}: OrderReviewProps) {
  // Calculate totals
  const totals = useMemo(() => {
    const total = subtotal + shippingCost + taxAmount - discountAmount;
    return {
      subtotal,
      shippingCost,
      taxAmount,
      discountAmount,
      total: Math.max(0, total),
    };
  }, [subtotal, shippingCost, taxAmount, discountAmount]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const getPaymentTypeIcon = (type?: string): string => {
    switch (type) {
      case 'card':
        return '💳';
      case 'bank':
        return '🏦';
      case 'wallet':
        return '👛';
      case 'crypto':
        return '₿';
      default:
        return '💰';
    }
  };

  return (
    <div className="space-y-6">
      {/* Order Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Items
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditCart}
            >
              Edit
            </Button>
          </div>
          <CardDescription>
            {itemCount} item{itemCount !== 1 ? 's' : ''} in your order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="space-y-2">
                <div className="flex gap-4">
                  {item.productImage && (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    {item.variantId && (
                      <p className="text-sm text-muted-foreground">
                        Variant: {item.variantId}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${item.price.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      ${(item.price * item.quantity).toFixed(2)} total
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Price Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>

            {/* Discount */}
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Discount
                  {discountCode && <span> ({discountCode})</span>}
                </span>
                <span className="text-green-600">
                  -${totals.discountAmount.toFixed(2)}
                </span>
              </div>
            )}

            {/* Shipping */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Shipping {shippingMethod && `(${shippingMethod.name})`}
              </span>
              {shippingCost === 0 ? (
                <span className="text-green-600 font-medium">FREE</span>
              ) : (
                <span>${totals.shippingCost.toFixed(2)}</span>
              )}
            </div>

            {/* Tax */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>${totals.taxAmount.toFixed(2)}</span>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address */}
      {shippingAddress && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Address
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEditAddress}
              >
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p className="font-medium">{shippingAddress.fullName}</p>
              <p className="text-muted-foreground">
                {shippingAddress.addressLine1}
                {shippingAddress.addressLine2 && `, ${shippingAddress.addressLine2}`}
              </p>
              <p className="text-muted-foreground">
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
              </p>
              <p className="text-muted-foreground">{shippingAddress.country}</p>
              {shippingAddress.phone && (
                <p className="text-muted-foreground">{shippingAddress.phone}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipping Method */}
      {shippingMethod && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Method
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEditShipping}
              >
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <p className="font-medium">{shippingMethod.name}</p>
                <p className="font-medium">
                  {shippingMethod.cost === 0 ? 'FREE' : `$${shippingMethod.cost.toFixed(2)}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method */}
      {paymentMethod && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Payment Method
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEditPayment}
              >
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getPaymentTypeIcon(paymentMethod.type)}</span>
                <div>
                  <p className="font-medium">{paymentMethod.name}</p>
                  {paymentMethod.last4 && (
                    <p className="text-muted-foreground">•••• {paymentMethod.last4}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Terms Acceptance */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={agreesToTerms}
              onCheckedChange={(checked) =>
                onAgreesToTermsChange(checked as boolean)
              }
              disabled={isProcessing}
            />
            <label
              htmlFor="terms"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              I agree to the Terms and Conditions and Privacy Policy. By clicking Place Order, I authorize the payment.
            </label>
          </div>
          {!agreesToTerms && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You must agree to the terms and conditions to proceed
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Order Summary Alert */}
      {!isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Some required information is missing. Please complete all sections before placing your order.
          </AlertDescription>
        </Alert>
      )}

      {/* Place Order Button */}
      <Button
        onClick={onPlaceOrder}
        disabled={isProcessing || !agreesToTerms || !isValid}
        size="lg"
        className="w-full"
      >
        {isProcessing ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
            Processing...
          </>
        ) : (
          <>
            <Check className="h-5 w-5 mr-2" />
            Place Order
          </>
        )}
      </Button>

      {/* Security Notice */}
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Your order is protected by our secure payment system. Your payment information is encrypted and safe.
        </AlertDescription>
      </Alert>
    </div>
  );
}
