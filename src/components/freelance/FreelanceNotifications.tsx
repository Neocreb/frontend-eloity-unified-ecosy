import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  X,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  DollarSign,
  Award,
  Trash2,
  CheckAll,
} from 'lucide-react';
import { useFreelanceNotifications, FreelanceNotification } from '@/hooks/use-freelance-notifications';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const getNotificationIcon = (type: FreelanceNotification['type']) => {
  switch (type) {
    case 'proposal':
      return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case 'milestone':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'payment':
      return <DollarSign className="h-5 w-5 text-emerald-500" />;
    case 'message':
      return <MessageSquare className="h-5 w-5 text-indigo-500" />;
    case 'review':
      return <Award className="h-5 w-5 text-yellow-500" />;
    case 'withdrawal':
      return <DollarSign className="h-5 w-5 text-purple-500" />;
    case 'dispute':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

const getNotificationColor = (type: FreelanceNotification['type']) => {
  switch (type) {
    case 'proposal':
      return 'bg-blue-50 border-blue-200';
    case 'milestone':
      return 'bg-green-50 border-green-200';
    case 'payment':
      return 'bg-emerald-50 border-emerald-200';
    case 'message':
      return 'bg-indigo-50 border-indigo-200';
    case 'review':
      return 'bg-yellow-50 border-yellow-200';
    case 'withdrawal':
      return 'bg-purple-50 border-purple-200';
    case 'dispute':
      return 'bg-red-50 border-red-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

interface FreelanceNotificationsProps {
  maxHeight?: string;
  maxNotifications?: number;
  showHeader?: boolean;
}

export const FreelanceNotifications: React.FC<FreelanceNotificationsProps> = ({
  maxHeight = 'h-[500px]',
  maxNotifications = 10,
  showHeader = true,
}) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useFreelanceNotifications();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const displayedNotifications = notifications.slice(0, maxNotifications);

  if (notifications.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </div>
          </CardHeader>
        )}
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
          <p className="text-muted-foreground">No notifications yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            You'll receive notifications when important events happen
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  •••
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {unreadCount > 0 && (
                  <DropdownMenuItem onClick={markAllAsRead}>
                    <CheckAll className="h-4 w-4 mr-2" />
                    Mark all as read
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={clearAll} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear all
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
      )}
      <CardContent className={`p-0 overflow-y-auto ${maxHeight}`}>
        <div className="space-y-2 p-4">
          {displayedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-lg p-4 transition-all cursor-pointer ${
                getNotificationColor(notification.type)
              } ${!notification.read ? 'border-l-4' : ''}`}
              onClick={() => {
                if (!notification.read) {
                  markAsRead(notification.id);
                }
                setExpandedId(expandedId === notification.id ? null : notification.id);
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-semibold ${!notification.read ? 'font-bold' : ''}`}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="h-2 w-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.description}
                      </p>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {expandedId === notification.id && notification.action && (
                    <div className="mt-3 pt-3 border-t">
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle action (e.g., navigate to project, approve milestone, etc.)
                          console.log('Action:', notification.action);
                        }}
                      >
                        {notification.action}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {notifications.length > maxNotifications && (
            <div className="text-center pt-2">
              <Button variant="outline" size="sm" className="w-full">
                View all {notifications.length} notifications
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
