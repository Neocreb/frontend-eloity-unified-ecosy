// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  ChevronLeft,
  CreditCard,
  CheckCircle,
  ArrowRight,
  Wallet,
  Banknote,
  Package,
  Bitcoin,
  Zap,
  Truck,
  MapPin,
  Clock,
  Star,
  Shield,
  Info
} from "lucide-react";
import { useEnhancedMarketplace } from "@/contexts/EnhancedMarketplaceContext";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import UniversalCryptoPaymentModal from "@/components/payments/UniversalCryptoPaymentModal";
import DeliveryProviderSelection from "@/components/delivery/DeliveryProviderSelection";
import { type PaymentRequest } from "@/services/unifiedCryptoPaymentService";
import MarketplaceBreadcrumb from "@/components/marketplace/MarketplaceBreadcrumb";

interface FormErrors {
  [key: string]: string | undefined;
}

const MarketplaceCheckout = () => {
  const { cart, getCartTotal, checkout, clearCart } = useEnhancedMarketplace();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [showCryptoPayment, setShowCryptoPayment] = useState(false);
  const [showDeliverySelection, setShowDeliverySelection] = useState(false);
  const [selectedDeliveryProvider, setSelectedDeliveryProvider] = useState<any>(null);
  const [deliveryServiceType, setDeliveryServiceType] = useState<string>("standard");
  const [deliveryMethod, setDeliveryMethod] = useState("delivery"); // "pickup" or "delivery"
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [shippingInfo, setShippingInfo] = useState({
    name: user?.user_metadata?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States"
  });
  
  const validateEmail = (email: string): string | undefined => {
    if (!email) return "Email address is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return undefined;
  };

  const validatePhone = (phone: string): string | undefined => {
    if (!phone) return "Phone number is required";
    const phoneRegex = /^[\d\s\-\(\)]+$|^$/;
    if (!phoneRegex.test(phone)) return "Please enter a valid phone number";
    if (phone.replace(/\D/g, "").length < 10) return "Phone number must be at least 10 digits";
    return undefined;
  };

  const validateZip = (zip: string): string | undefined => {
    if (!zip) return "Zip code is required";
    if (!/^\d{5}(-\d{4})?$/.test(zip) && !/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(zip)) {
      return "Please enter a valid zip code";
    }
    return undefined;
  };

  const validateField = (name: string, value: string): string | undefined => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      const fieldLabels: Record<string, string> = {
        name: "Full name",
        email: "Email address",
        phone: "Phone number",
        address: "Address",
        city: "City",
        state: "State",
        zip: "Zip code",
        country: "Country"
      };
      return `${fieldLabels[name] || name} is required`;
    }

    if (name === "email") return validateEmail(value);
    if (name === "phone") return validatePhone(value);
    if (name === "zip") return validateZip(value);
    if (name === "name" && trimmedValue.length < 2) return "Please enter your full name";
    if (name === "city" && trimmedValue.length < 2) return "Please enter a valid city";
    if (name === "state" && trimmedValue.length < 2) return "Please enter a valid state";

    return undefined;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleDeliveryProviderSelect = (provider: any, serviceType: string) => {
    setSelectedDeliveryProvider(provider);
    setDeliveryServiceType(serviceType);
    setShowDeliverySelection(false);
    toast({
      title: "Delivery Provider Selected",
      description: `${provider.businessName} - ${serviceType.replace('_', ' ')} delivery`,
    });
  };

  const calculateDeliveryFee = () => {
    if (deliveryMethod === "pickup") return 0;
    if (!selectedDeliveryProvider) return 5.99; // Default shipping

    const serviceMultiplier = {
      standard: 1.0,
      express: 1.5,
      same_day: 1.3,
    }[deliveryServiceType] || 1.0;

    return selectedDeliveryProvider.estimatedFee * serviceMultiplier;
  };
  
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Add some products before checking out.",
        variant: "destructive"
      });
      return;
    }

    if (deliveryMethod === "delivery" && !selectedDeliveryProvider) {
      toast({
        title: "Delivery Provider Required",
        description: "Please select a delivery provider to continue.",
        variant: "destructive"
      });
      return;
    }

    // Validate all shipping info fields
    const requiredFields = ['name', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country'];
    const newErrors: FormErrors = {};

    requiredFields.forEach(field => {
      const error = validateField(field, shippingInfo[field as keyof typeof shippingInfo]);
      if (error) {
        newErrors[field] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      const firstErrorField = Object.keys(newErrors)[0];
      const fieldLabels: Record<string, string> = {
        name: "Full name",
        email: "Email address",
        phone: "Phone number",
        address: "Address",
        city: "City",
        state: "State",
        zip: "Zip code",
        country: "Country"
      };
      toast({
        title: "Missing or Invalid Information",
        description: `Please correct the errors in your form, starting with: ${fieldLabels[firstErrorField]}`,
        variant: "destructive"
      });
      return;
    }

    // Handle crypto payment
    if (paymentMethod === 'crypto') {
      setShowCryptoPayment(true);
      return;
    }

    setIsProcessing(true);

    try {
      const order = await checkout();
      clearCart();
      navigate('/app/marketplace');
      toast({
        title: "Order Placed Successfully",
        description: `Order #${order?.id || 'XXXX'} confirmed. You'll receive order updates via ${shippingInfo.email}`,
      });
    } catch (error: any) {
      console.error("Checkout error:", error);
      let errorTitle = "Order Processing Failed";
      let errorDescription = "Unable to process your order. Please try again.";

      if (error?.message?.includes("payment")) {
        errorTitle = "Payment Processing Failed";
        errorDescription = `Your payment could not be processed. Please verify your ${paymentMethod === 'card' ? 'card details' : 'payment method'} and try again.`;
      } else if (error?.message?.includes("stock")) {
        errorTitle = "Item Out of Stock";
        errorDescription = "One or more items in your cart are no longer available. Please review your cart and try again.";
      } else if (error?.message?.includes("inventory")) {
        errorTitle = "Insufficient Inventory";
        errorDescription = "The requested quantity for one or more items is not available. Please adjust your order quantities.";
      } else if (error?.message?.includes("delivery")) {
        errorTitle = "Delivery Service Unavailable";
        errorDescription = "The selected delivery option is not available. Please select another delivery method.";
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCryptoPaymentSuccess = async () => {
    setShowCryptoPayment(false);
    setIsProcessing(true);

    try {
      const order = await checkout();
      clearCart();
      navigate('/app/marketplace');
      toast({
        title: "Order Placed Successfully",
        description: "Thank you for your cryptocurrency purchase!",
      });
    } catch (error) {
      toast({
        title: "Order Processing Failed",
        description: "Payment was successful but order processing failed. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const createCryptoPaymentRequest = (): PaymentRequest => {
    return {
      amount: total,
      purpose: 'marketplace',
      recipientId: 'marketplace',
      metadata: {
        cartItems: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
        })),
        shippingInfo,
        orderId: 'order_' + Date.now(),
      },
    };
  };
  
  const subTotal = getCartTotal();
  const shippingCost = subTotal > 0 ? calculateDeliveryFee() : 0;
  const tax = subTotal * 0.08; // 8% tax
  const total = subTotal + shippingCost + tax;
  
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };
  
  return (
    <div className="container py-6">
      <MarketplaceBreadcrumb
        items={[
          { label: 'Marketplace', href: '/app/marketplace' },
          { label: 'Shopping Cart', href: '/app/marketplace/cart' },
          { label: 'Checkout' },
        ]}
        className="mb-6"
      />

      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/marketplace/cart")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Checkout</h1>
      </div>
      
      {cart.length === 0 ? (
        <Card className="bg-gray-50">
          <CardContent className="pt-6 text-center">
            <div className="py-12 space-y-4">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto" />
              <h3 className="text-xl font-medium">Your Cart is Empty</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You haven't added any products to your cart yet. Browse the marketplace to find products you love.
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate('/app/marketplace')}
              >
                Browse Products
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Method Selection */}
            <Card>
              <CardHeader className="border-b">
                <h2 className="text-lg font-medium">Delivery Method</h2>
              </CardHeader>

              <CardContent className="pt-6">
                <RadioGroup
                  value={deliveryMethod}
                  onValueChange={setDeliveryMethod}
                >
                  <div className="flex items-center space-x-2 border rounded-md p-3 mb-3 cursor-pointer hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="delivery" id="delivery-method" />
                    <Label htmlFor="delivery-method" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Truck className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">Home Delivery</div>
                        <div className="text-sm text-gray-500">Get your items delivered to your doorstep</div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="pickup" id="pickup-method" />
                    <Label htmlFor="pickup-method" className="flex items-center gap-2 cursor-pointer flex-1">
                      <MapPin className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">Store Pickup</div>
                        <div className="text-sm text-gray-500">Pick up from nearest store location</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {deliveryMethod === "delivery" && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Delivery Provider</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeliverySelection(true)}
                      >
                        {selectedDeliveryProvider ? "Change Provider" : "Select Provider"}
                      </Button>
                    </div>

                    {selectedDeliveryProvider ? (
                      <div className="bg-white p-3 rounded border">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium truncate">{selectedDeliveryProvider.businessName}</span>
                              {selectedDeliveryProvider.isVerified && (
                                <Badge variant="secondary" className="text-xs flex-shrink-0">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />
                                <span>{selectedDeliveryProvider.rating}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span>~{selectedDeliveryProvider.estimatedDeliveryTime}h</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {deliveryServiceType.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          <div className="md:text-right flex-shrink-0">
                            <div className="font-medium text-green-600">
                              ${calculateDeliveryFee().toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">delivery fee</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Truck className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>Select a delivery provider to see pricing and delivery times</p>
                      </div>
                    )}
                  </div>
                )}

                {deliveryMethod === "pickup" && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Free Pickup Available</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Pick up your order from our store locations within 3-5 business days.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card>
              <CardHeader className="border-b">
                <h2 className="text-lg font-medium">
                  {deliveryMethod === "delivery" ? "Delivery Information" : "Pickup Information"}
                </h2>
              </CardHeader>
              
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      value={shippingInfo.name}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className={formErrors.name ? "border-red-500" : ""}
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={shippingInfo.email}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className={formErrors.email ? "border-red-500" : ""}
                    />
                    {formErrors.email && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="(123) 456-7890"
                    value={shippingInfo.phone}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    className={formErrors.phone ? "border-red-500" : ""}
                  />
                  {formErrors.phone && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      {formErrors.phone}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">
                    {deliveryMethod === "delivery" ? "Delivery Address" : "Contact Address"} *
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder={deliveryMethod === "delivery" ? "123 Main St, Apt 4B" : "Your contact address"}
                    value={shippingInfo.address}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    className={formErrors.address ? "border-red-500" : ""}
                  />
                  {formErrors.address && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      {formErrors.address}
                    </p>
                  )}
                  {deliveryMethod === "pickup" && (
                    <p className="text-sm text-gray-500 mt-2">
                      We'll notify you when your order is ready for pickup at the selected store location.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="New York"
                      value={shippingInfo.city}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className={formErrors.city ? "border-red-500" : ""}
                    />
                    {formErrors.city && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        {formErrors.city}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      placeholder="NY"
                      value={shippingInfo.state}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className={formErrors.state ? "border-red-500" : ""}
                    />
                    {formErrors.state && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        {formErrors.state}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zip">Zip Code *</Label>
                    <Input
                      id="zip"
                      name="zip"
                      placeholder="10001"
                      value={shippingInfo.zip}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className={formErrors.zip ? "border-red-500" : ""}
                    />
                    {formErrors.zip && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        {formErrors.zip}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      name="country"
                      placeholder="United States"
                      value={shippingInfo.country}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className={formErrors.country ? "border-red-500" : ""}
                    />
                    {formErrors.country && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        {formErrors.country}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Payment Method */}
            <Card>
              <CardHeader className="border-b">
                <h2 className="text-lg font-medium">Payment Method</h2>
              </CardHeader>
              
              <CardContent className="pt-6">
                <RadioGroup 
                  value={paymentMethod} 
                  onValueChange={setPaymentMethod}
                >
                  <div className="flex items-center space-x-2 border rounded-md p-3 mb-3 cursor-pointer hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="card" id="payment-card" />
                    <Label htmlFor="payment-card" className="flex items-center gap-2 cursor-pointer">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      Credit / Debit Card
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 border rounded-md p-3 mb-3 cursor-pointer hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="wallet" id="payment-wallet" />
                    <Label htmlFor="payment-wallet" className="flex items-center gap-2 cursor-pointer">
                      <Wallet className="h-5 w-5 text-purple-600" />
                      Digital Wallet
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 border rounded-md p-3 mb-3 cursor-pointer hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="crypto" id="payment-crypto" />
                    <Label htmlFor="payment-crypto" className="flex items-center gap-2 cursor-pointer">
                      <Bitcoin className="h-5 w-5 text-orange-500" />
                      <div className="flex flex-col">
                        <span>Cryptocurrency</span>
                        <span className="text-xs text-muted-foreground">Pay with Bitcoin, Ethereum, USDT, or Solana</span>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="cash" id="payment-cash" />
                    <Label htmlFor="payment-cash" className="flex items-center gap-2 cursor-pointer">
                      <Banknote className="h-5 w-5 text-green-600" />
                      Cash on Delivery
                    </Label>
                  </div>
                </RadioGroup>
                
                {paymentMethod === 'card' && (
                  <div className="mt-4 border rounded-md p-4 bg-gray-50">
                    <p className="text-muted-foreground text-sm">
                      For demo purposes, no actual payment will be processed.
                    </p>
                  </div>
                )}

                {paymentMethod === 'crypto' && (
                  <div className="mt-4 border rounded-md p-4 bg-orange-50 border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-orange-800">Fast & Secure Crypto Payment</span>
                    </div>
                    <p className="text-orange-700 text-sm">
                      Pay instantly with your crypto wallet. Transactions are secured by blockchain technology and typically confirm within minutes.
                    </p>
                    <div className="mt-2 text-sm text-orange-600">
                      • No chargebacks or payment disputes
                      • Lower transaction fees
                      • Enhanced privacy protection
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader className="border-b">
                <h2 className="text-lg font-medium">Order Summary</h2>
              </CardHeader>
              
              <CardContent className="pt-6 divide-y">
                <div className="space-y-4 pb-4">
                  {cart.map(item => (
                    <div key={item.productId || item.id} className="flex gap-3">
                      <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                        <img
                          src={item.product?.image || ""}
                          alt={item.product?.name || "Product"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium line-clamp-1">{item.product?.name || "Product"}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="font-semibold">
                          ${(item.priceSnapshot * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4 py-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subTotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {deliveryMethod === "delivery" ? (
                        selectedDeliveryProvider ?
                        `Delivery (${deliveryServiceType.replace('_', ' ')})` :
                        "Delivery"
                      ) : "Pickup"}
                    </span>
                    <span className={deliveryMethod === "pickup" ? "text-green-600" : ""}>
                      {deliveryMethod === "pickup" ? "FREE" : formatCurrency(shippingCost)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (8%)</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between pt-4 font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </CardContent>
              
              <CardFooter className="border-t bg-gray-50 flex-col gap-3">
                <Button 
                  className="w-full flex items-center gap-2"
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Package className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : paymentMethod === 'crypto' ? (
                    <>
                      <Bitcoin className="h-4 w-4" />
                      Pay with Crypto
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Place Order
                    </>
                  )}
                </Button>
                
                <div className="text-xs text-center text-muted-foreground">
                  By placing your order, you agree to our terms of service and privacy policy.
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}

      {/* Crypto Payment Modal */}
      <UniversalCryptoPaymentModal
        isOpen={showCryptoPayment}
        onClose={() => setShowCryptoPayment(false)}
        paymentRequest={createCryptoPaymentRequest()}
        onSuccess={handleCryptoPaymentSuccess}
        onError={(error) => {
          console.error('Crypto payment error:', error);
          setShowCryptoPayment(false);
        }}
        title="Complete Your Purchase"
        description="Pay for your marketplace order using cryptocurrency"
      />

      {/* Delivery Provider Selection Modal */}
      <DeliveryProviderSelection
        open={showDeliverySelection}
        onClose={() => setShowDeliverySelection(false)}
        pickupAddress={{ address: "Store Location" }} // In real app, this would be seller's address
        deliveryAddress={{ address: shippingInfo.address }}
        packageDetails={{
          weight: cart.reduce((total, item) => total + (item.quantity * 0.5), 0), // Estimate 0.5kg per item
          value: subTotal,
          description: `${cart.length} item(s) from marketplace`
        }}
        onProviderSelect={handleDeliveryProviderSelect}
      />
    </div>
  );
};

export default MarketplaceCheckout;
