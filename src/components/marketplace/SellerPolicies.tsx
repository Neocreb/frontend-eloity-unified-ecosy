import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  RotateCcw,
  Truck,
  ShieldAlert,
  Clock,
  DollarSign,
  AlertCircle,
} from "lucide-react";

interface SellerPolicy {
  id: string;
  name: string;
  description: string;
  details: string[];
  icon: React.ReactNode;
  badge?: string;
}

interface SellerPoliciesProps {
  policies?: SellerPolicy[];
  returnDays?: number;
  shippingTime?: number;
  refundTime?: number;
}

const SellerPolicies: React.FC<SellerPoliciesProps> = ({
  policies,
  returnDays = 30,
  shippingTime = 3,
  refundTime = 5,
}) => {
  const defaultPolicies: SellerPolicy[] = [
    {
      id: "returns",
      name: "Return Policy",
      description: `Easy returns within ${returnDays} days`,
      details: [
        `Customers can return items within ${returnDays} days of purchase`,
        "Items must be unused and in original packaging",
        "Free return shipping for defective items",
        "Refunds processed within 5-7 business days",
        "Partial returns accepted",
      ],
      icon: <RotateCcw className="h-6 w-6 text-blue-500" />,
      badge: "Customer Friendly",
    },
    {
      id: "shipping",
      name: "Shipping Policy",
      description: `Ships within ${shippingTime} business days`,
      details: [
        `Orders ship within ${shippingTime} business days`,
        "Multiple shipping options available",
        "Real-time tracking provided",
        "Insured shipping on orders over $100",
        "International shipping available",
      ],
      icon: <Truck className="h-6 w-6 text-green-500" />,
      badge: "Fast Shipping",
    },
    {
      id: "refunds",
      name: "Refund Policy",
      description: `Refunds within ${refundTime} business days`,
      details: [
        `Refunds processed within ${refundTime} business days of approval`,
        "Full refunds for defective or damaged items",
        "Partial refunds for used items (15-50% deduction)",
        "Original shipping cost non-refundable",
        "Refunds issued to original payment method",
      ],
      icon: <DollarSign className="h-6 w-6 text-purple-500" />,
    },
    {
      id: "security",
      name: "Buyer Protection",
      description: "100% secure transactions guaranteed",
      details: [
        "Buyer protection on all purchases",
        "Secure payment processing",
        "Dispute resolution support",
        "Money-back guarantee if item not received",
        "Identity verification for high-value items",
      ],
      icon: <ShieldAlert className="h-6 w-6 text-red-500" />,
      badge: "Protected",
    },
    {
      id: "communication",
      name: "Communication",
      description: "Quick and responsive support",
      details: [
        "Average response time: 2-4 hours",
        "Customer support available 6 days a week",
        "Multiple contact channels (chat, email, phone)",
        "Multilingual support available",
        "Quick resolution of issues",
      ],
      icon: <Clock className="h-6 w-6 text-orange-500" />,
    },
  ];

  const policiesToShow = policies || defaultPolicies;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Store Policies</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policiesToShow.map((policy) => (
          <Card key={policy.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {policy.icon}
                  <div>
                    <CardTitle className="text-lg">{policy.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {policy.description}
                    </p>
                  </div>
                </div>
                {policy.badge && (
                  <Badge className="whitespace-nowrap">{policy.badge}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {policy.details.map((detail, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-blue-500 flex-shrink-0">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Important Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Important Information
              </h3>
              <p className="text-sm text-blue-800">
                Please read our store policies carefully before making a purchase.
                If you have any questions about these policies, feel free to contact
                us directly through the messaging system.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policy Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {returnDays}
            </div>
            <p className="text-xs text-gray-600">Day Returns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {shippingTime}
            </div>
            <p className="text-xs text-gray-600">Day Shipping</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {refundTime}
            </div>
            <p className="text-xs text-gray-600">Day Refunds</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">100%</div>
            <p className="text-xs text-gray-600">Protected</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerPolicies;
