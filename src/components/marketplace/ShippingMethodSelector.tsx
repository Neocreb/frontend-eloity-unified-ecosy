import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Truck,
  Clock,
  DollarSign,
  Zap,
  AlertCircle,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  cost: number;
  estimatedDays: number;
  carrier?: string;
  isExpressShipping?: boolean;
  freeThreshold?: number;
  discount?: number;
}

interface ShippingMethodSelectorProps {
  methods: ShippingMethod[];
  selectedMethodId?: string;
  onMethodSelect: (method: ShippingMethod) => void;
  cartTotal: number;
  isLoading?: boolean;
  estimatedDeliveryDates?: Record<string, string>;
}

export default function ShippingMethodSelector({
  methods,
  selectedMethodId,
  onMethodSelect,
  cartTotal,
  isLoading = false,
  estimatedDeliveryDates,
}: ShippingMethodSelectorProps) {
  if (methods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No shipping methods available for your address
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const calculateFinalCost = (method: ShippingMethod): number => {
    if (method.freeThreshold && cartTotal >= method.freeThreshold) {
      return 0;
    }
    return Math.max(0, method.cost - (method.discount || 0));
  };

  const getDeliveryDate = (method: ShippingMethod): string => {
    if (estimatedDeliveryDates?.[method.id]) {
      return estimatedDeliveryDates[method.id];
    }
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(deliveryDate.getDate() + method.estimatedDays);
    return deliveryDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getEstimatedRange = (method: ShippingMethod): string => {
    const minDays = Math.max(1, method.estimatedDays - 1);
    if (minDays === method.estimatedDays) {
      return `${method.estimatedDays} business day${method.estimatedDays !== 1 ? 's' : ''}`;
    }
    return `${minDays}-${method.estimatedDays} business days`;
  };

  const isFreeShipping = (method: ShippingMethod): boolean => {
    return calculateFinalCost(method) === 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Shipping Method
        </CardTitle>
        <CardDescription>
          Select a delivery method for your order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedMethodId} onValueChange={(value) => {
          const method = methods.find((m) => m.id === value);
          if (method) {
            onMethodSelect(method);
          }
        }}>
          <div className="space-y-3">
            {methods.map((method) => {
              const finalCost = calculateFinalCost(method);
              const isSelected = selectedMethodId === method.id;
              const isFree = isFreeShipping(method);

              return (
                <div key={method.id}>
                  <div
                    className={cn(
                      'relative flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all',
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'
                    )}
                    onClick={() => {
                      const selectedMethod = methods.find((m) => m.id === method.id);
                      if (selectedMethod) {
                        onMethodSelect(selectedMethod);
                      }
                    }}
                  >
                    <RadioGroupItem
                      value={method.id}
                      id={`method-${method.id}`}
                      className="mt-1"
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor={`method-${method.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="space-y-2">
                        {/* Method Name & Badges */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{method.name}</p>
                            {method.isExpressShipping && (
                              <Badge className="gap-1">
                                <Zap className="h-3 w-3" />
                                Express
                              </Badge>
                            )}
                            {isFree && (
                              <Badge variant="secondary" className="gap-1">
                                <Check className="h-3 w-3" />
                                Free
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            {isFree ? (
                              <p className="font-semibold text-green-600">FREE</p>
                            ) : (
                              <>
                                {method.discount ? (
                                  <div className="space-y-1">
                                    <p className="text-xs line-through text-muted-foreground">
                                      ${method.cost.toFixed(2)}
                                    </p>
                                    <p className="font-semibold text-green-600">
                                      ${finalCost.toFixed(2)}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="font-semibold">
                                    ${finalCost.toFixed(2)}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        {method.description && (
                          <p className="text-sm text-muted-foreground">
                            {method.description}
                          </p>
                        )}

                        {/* Carrier Info */}
                        {method.carrier && (
                          <p className="text-xs text-muted-foreground">
                            Carrier: {method.carrier}
                          </p>
                        )}

                        {/* Delivery Timeframe */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{getEstimatedRange(method)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Arrives {getDeliveryDate(method)}
                          </div>
                        </div>

                        {/* Free Shipping Info */}
                        {method.freeThreshold && cartTotal < method.freeThreshold && !isFree && (
                          <p className="text-xs text-amber-600">
                            Free over ${method.freeThreshold.toFixed(2)} (${(method.freeThreshold - cartTotal).toFixed(2)} more)
                          </p>
                        )}
                      </div>
                    </Label>
                    {isSelected && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </RadioGroup>

        {/* Shipping Info Note */}
        <Alert className="mt-6">
          <Truck className="h-4 w-4" />
          <AlertDescription>
            Shipping cost calculated based on your delivery address. Delivery dates are estimates and may vary.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
