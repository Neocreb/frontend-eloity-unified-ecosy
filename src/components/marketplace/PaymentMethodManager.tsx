import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { PaymentMethod } from '@/types/marketplace';
import { cn } from '@/lib/utils';

// Validation schema
const paymentMethodSchema = z.object({
  type: z.enum(['card', 'bank', 'wallet', 'crypto']),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  cardNumber: z.string().regex(/^\d{13,19}$/, 'Invalid card number').optional().or(z.literal('')),
  cardholderName: z.string().optional(),
  expiryMonth: z.string().optional(),
  expiryYear: z.string().optional(),
  cvv: z.string().regex(/^\d{3,4}$/, 'Invalid CVV').optional().or(z.literal('')),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  routingNumber: z.string().optional(),
  walletAddress: z.string().optional(),
  isDefault: z.boolean().optional(),
}).refine((data) => {
  if (data.type === 'card') {
    return data.cardNumber && data.expiryMonth && data.expiryYear && data.cvv;
  }
  return true;
}, 'Card details required for card payment method');

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

interface PaymentMethodManagerProps {
  savedMethods: PaymentMethod[];
  selectedMethodId?: string;
  onMethodSelect: (method: PaymentMethod) => void;
  onAddMethod: (method: Omit<PaymentMethod, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteMethod?: (methodId: string) => Promise<void>;
  isLoading?: boolean;
  allowAddNew?: boolean;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 20 }, (_, i) => currentYear + i);
const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

const cardBrands: Record<string, { name: string; label: string }> = {
  visa: { name: 'Visa', label: '💳' },
  mastercard: { name: 'Mastercard', label: '💳' },
  amex: { name: 'American Express', label: '💳' },
  discover: { name: 'Discover', label: '💳' },
};

export default function PaymentMethodManager({
  savedMethods,
  selectedMethodId,
  onMethodSelect,
  onAddMethod,
  onDeleteMethod,
  isLoading = false,
  allowAddNew = true,
}: PaymentMethodManagerProps) {
  const [isAddingNew, setIsAddingNew] = useState(!selectedMethodId);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<'card' | 'bank' | 'wallet' | 'crypto'>('card');

  const form = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: 'card',
      name: '',
      cardNumber: '',
      cardholderName: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      walletAddress: '',
      isDefault: false,
    },
  });

  const onSubmit = async (data: PaymentMethodFormData) => {
    try {
      setSubmitError(null);
      const last4 = data.cardNumber ? data.cardNumber.slice(-4) : '';
      
      await onAddMethod({
        type: data.type,
        name: data.name,
        last4: last4 || undefined,
        expiryMonth: data.expiryMonth ? parseInt(data.expiryMonth) : undefined,
        expiryYear: data.expiryYear ? parseInt(data.expiryYear) : undefined,
        isDefault: data.isDefault || false,
        brand: data.type === 'card' ? 'visa' : undefined,
      });
      
      form.reset();
      setIsAddingNew(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to save payment method'
      );
    }
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    onMethodSelect(method);
    setIsAddingNew(false);
  };

  const handleDeleteMethod = async (methodId: string) => {
    if (onDeleteMethod) {
      try {
        await onDeleteMethod(methodId);
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : 'Failed to delete payment method'
        );
      }
    }
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  const getPaymentTypeIcon = (type: PaymentMethod['type']): string => {
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

  const getPaymentTypeLabel = (type: PaymentMethod['type']): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Saved Payment Methods */}
      {savedMethods.length > 0 && !isAddingNew && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            {savedMethods.length === 1 ? 'Payment Method' : 'Payment Methods'}
          </h3>
          <div className="space-y-2">
            {savedMethods.map((method) => (
              <Card
                key={method.id}
                className={cn(
                  'cursor-pointer transition-all hover:border-primary',
                  selectedMethodId === method.id && 'border-primary bg-primary/5'
                )}
                onClick={() => handleSelectMethod(method)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getPaymentTypeIcon(method.type)}</span>
                        <div>
                          <p className="font-medium">{method.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {getPaymentTypeLabel(method.type)}
                            {method.last4 && ` •••• ${method.last4}`}
                          </p>
                        </div>
                        {method.isDefault && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      {method.expiryMonth && method.expiryYear && (
                        <p className="text-xs text-muted-foreground">
                          Expires {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {onDeleteMethod && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this payment method?')) {
                              handleDeleteMethod(method.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                      {selectedMethodId === method.id && (
                        <Badge className="gap-1">
                          <Check className="h-3 w-3" />
                          Selected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {allowAddNew && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setIsAddingNew(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          )}
        </div>
      )}

      {/* Payment Method Form */}
      {(isAddingNew && !selectedMethodId) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Add Payment Method
            </CardTitle>
            <CardDescription>
              Add a new payment method for your order
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Payment Type Selection */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Payment Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={(value: any) => {
                            field.onChange(value);
                            setPaymentType(value);
                          }}
                          className="flex gap-4"
                        >
                          {['card', 'bank', 'wallet', 'crypto'].map((type) => (
                            <div key={type} className="flex items-center space-x-2">
                              <RadioGroupItem value={type} id={`type-${type}`} />
                              <Label htmlFor={`type-${type}`} className="capitalize cursor-pointer">
                                {type}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Display Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={`e.g., My ${paymentType} Account`} 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        This helps you identify this payment method
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Card Details */}
                {paymentType === 'card' && (
                  <>
                    <FormField
                      control={form.control}
                      name="cardholderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cardholder Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="1234 5678 9012 3456"
                              {...field}
                              onChange={(e) => {
                                const formatted = formatCardNumber(e.target.value);
                                field.onChange(formatted.replace(/\s/g, ''));
                              }}
                              maxLength={19}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="expiryMonth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Month</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="MM" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {months.map((month) => (
                                  <SelectItem key={month} value={month}>
                                    {month}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="expiryYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="YYYY" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {years.map((year) => (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cvv"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CVV</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="123"
                                type="password"
                                {...field}
                                maxLength={4}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {/* Bank Account Details */}
                {paymentType === 'bank' && (
                  <>
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Bank" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="routingNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Routing Number</FormLabel>
                          <FormControl>
                            <Input placeholder="123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="••••••••••••1234"
                              type="password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Wallet Address */}
                {(paymentType === 'wallet' || paymentType === 'crypto') && (
                  <FormField
                    control={form.control}
                    name="walletAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {paymentType === 'crypto' ? 'Wallet Address' : 'Account/ID'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0x1234...5678"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Set as Default */}
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Set as default payment method
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {/* Security Note */}
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Your payment information is securely encrypted and never stored on our servers
                  </AlertDescription>
                </Alert>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading || form.formState.isSubmitting}
                  >
                    {isLoading || form.formState.isSubmitting
                      ? 'Saving...'
                      : 'Save Payment Method'}
                  </Button>
                  {savedMethods.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingNew(false)}
                      disabled={isLoading || form.formState.isSubmitting}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
