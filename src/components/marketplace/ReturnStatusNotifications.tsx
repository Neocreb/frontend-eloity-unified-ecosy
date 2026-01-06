import React, { useState, useEffect } from "react";
import {
  Bell,
  Package,
  CheckCircle,
  AlertCircle,
  Clock,
  Truck,
  DollarSign,
  MessageSquare,
  X,
  Eye,
  Archive,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export type ReturnStatus =
  | "initiated"
  | "approved"
  | "rejected"
  | "shipped"
  | "received"
  | "inspected"
  | "refunded"
  | "completed";

export type NotificationType =
  | "return_initiated"
  | "return_approved"
  | "return_rejected"
  | "return_shipped"
  | "return_received"
  | "return_inspected"
  | "return_refunded"
  | "return_completed";

interface ReturnNotification {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage?: string;
  status: ReturnStatus;
  notificationType: NotificationType;
  message: string;
  details?: {
    refundAmount?: number;
    trackingNumber?: string;
    expectedDate?: string;
    rejectionReason?: string;
  };
  timestamp: Date;
  read: boolean;
  seller?: {
    name: string;
    avatar?: string;
  };
}

interface ReturnStatusNotificationsProps {
  orderId?: string;
  onStatusChange?: (status: ReturnStatus) => void;
  showBadge?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Return Status Notifications Component
 * Manages and displays notifications for return requests and status updates
 * Integrates with return management system
 */
export const ReturnStatusNotifications: React.FC<
  ReturnStatusNotificationsProps
> = ({
  orderId,
  onStatusChange,
  showBadge = true,
  compact = false,
  className,
}) => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<ReturnNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [isOpen, setIsOpen] = useState(false);

  // Simulate loading notifications
  useEffect(() => {
    loadNotifications();
    // Set up polling for new notifications
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [orderId]);

  const loadNotifications = async () => {
    try {
      // In a real app, this would fetch from the backend
      const mockNotifications: ReturnNotification[] = [
        {
          id: "notif-1",
          orderId: "ORD-001",
          productId: "prod-1",
          productName: "Wireless Headphones",
          productImage:
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
          status: "approved",
          notificationType: "return_approved",
          message: "Your return request has been approved",
          details: {
            trackingNumber: "TRK123456789",
            expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
          },
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: true,
          seller: {
            name: "Tech Store",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
          },
        },
        {
          id: "notif-2",
          orderId: "ORD-002",
          productId: "prod-2",
          productName: "USB-C Cable",
          productImage:
            "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400",
          status: "refunded",
          notificationType: "return_refunded",
          message: "Your refund has been processed",
          details: {
            refundAmount: 29.99,
          },
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          read: false,
          seller: {
            name: "Electronics Hub",
          },
        },
        {
          id: "notif-3",
          orderId: "ORD-003",
          productId: "prod-3",
          productName: "Phone Case",
          productImage:
            "https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=400",
          status: "initiated",
          notificationType: "return_initiated",
          message: "Return request initiated",
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          read: false,
          seller: {
            name: "Mobile Accessories",
          },
        },
      ];

      setNotifications(mockNotifications);
      const unread = mockNotifications.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    toast({
      title: "All marked as read",
      description: "All notifications have been marked as read",
    });
  };

  const deleteNotification = (notificationId: string) => {
    const notification = notifications.find((n) => n.id === notificationId);
    setNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    );
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    toast({
      title: "Notification deleted",
      description: "The notification has been removed",
    });
  };

  const archiveNotification = (notificationId: string) => {
    // In a real app, this would archive the notification
    deleteNotification(notificationId);
  };

  const getStatusIcon = (status: ReturnStatus) => {
    switch (status) {
      case "initiated":
        return <Package className="w-4 h-4 text-blue-600" />;
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "shipped":
        return <Truck className="w-4 h-4 text-purple-600" />;
      case "received":
        return <Package className="w-4 h-4 text-orange-600" />;
      case "inspected":
        return <Eye className="w-4 h-4 text-blue-600" />;
      case "refunded":
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadgeColor = (status: ReturnStatus) => {
    switch (status) {
      case "initiated":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "received":
        return "bg-orange-100 text-orange-800";
      case "inspected":
        return "bg-blue-100 text-blue-800";
      case "refunded":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: ReturnStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
  };

  const filteredNotifications = activeTab === "unread"
    ? notifications.filter((n) => !n.read)
    : notifications;

  const NotificationItem: React.FC<{ notification: ReturnNotification }> = ({
    notification,
  }) => (
    <div
      className={cn(
        "p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer",
        !notification.read && "bg-blue-50"
      )}
      onClick={() => markAsRead(notification.id)}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          {notification.productImage ? (
            <img
              src={notification.productImage}
              alt={notification.productName}
              className="w-12 h-12 rounded object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
              {getStatusIcon(notification.status)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm text-gray-900">
                {notification.message}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {notification.productName}
              </p>
            </div>
            {!notification.read && (
              <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5"></div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge className={getStatusBadgeColor(notification.status)}>
              {getStatusLabel(notification.status)}
            </Badge>

            {notification.details?.trackingNumber && (
              <Badge variant="outline" className="text-xs">
                {notification.details.trackingNumber}
              </Badge>
            )}

            {notification.details?.refundAmount && (
              <Badge variant="outline" className="text-xs">
                ${notification.details.refundAmount.toFixed(2)}
              </Badge>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-2">
            {new Date(notification.timestamp).toLocaleDateString()}{" "}
            {new Date(notification.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Actions</span>
                <MessageSquare className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  archiveNotification(notification.id);
                }}
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {notification.details?.rejectionReason && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
          <strong>Reason:</strong> {notification.details.rejectionReason}
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className={cn("", className)}>
        <Button
          variant="outline"
          size="sm"
          className="relative"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && showBadge && (
            <Badge
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>

        {isOpen && (
          <Card className="absolute right-0 top-12 w-96 shadow-lg z-50">
            <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Return Notifications</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto p-0">
              {filteredNotifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-600">
                  {activeTab === "unread"
                    ? "No unread notifications"
                    : "No notifications"}
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                  />
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Return Status Notifications
            {unreadCount > 0 && showBadge && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="link"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="all" className="flex-1">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="m-0">
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="unread" className="m-0">
            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">All caught up!</p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ReturnStatusNotifications;
