import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface FreelanceNotification {
  id: string;
  userId: string;
  type: 'proposal' | 'milestone' | 'payment' | 'message' | 'review' | 'withdrawal' | 'dispute';
  title: string;
  description: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: Date;
  action?: string;
}

interface UseFreelanceNotificationsResult {
  notifications: FreelanceNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useFreelanceNotifications = (): UseFreelanceNotificationsResult => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<FreelanceNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load initial notifications
  useEffect(() => {
    if (!user?.id) return;

    const loadNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('freelance_notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        const transformedNotifications = (data || []).map(notif => ({
          id: notif.id,
          userId: notif.user_id,
          type: notif.type,
          title: notif.title,
          description: notif.description,
          data: notif.data || {},
          read: notif.read || false,
          createdAt: new Date(notif.created_at),
          action: notif.action,
        }));

        setNotifications(transformedNotifications);
        const unread = transformedNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
        console.error('Error loading notifications:', errorMessage);
        // Gracefully handle missing table - return empty notifications
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    loadNotifications();
  }, [user?.id]);

  // Subscribe to real-time notification updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`freelance_notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'freelance_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as any;
          const notification: FreelanceNotification = {
            id: newNotif.id,
            userId: newNotif.user_id,
            type: newNotif.type,
            title: newNotif.title,
            description: newNotif.description,
            data: newNotif.data || {},
            read: false,
            createdAt: new Date(newNotif.created_at),
            action: newNotif.action,
          };

          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast notification
          toast({
            title: notification.title,
            description: notification.description,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, toast]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const { error } = await supabase
          .from('freelance_notifications')
          .update({ read: true })
          .eq('id', notificationId);

        if (error) throw error;

        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );

        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
        console.error('Error marking notification as read:', errorMessage);
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    try {
      if (!user?.id) return;

      const unreadIds = notifications
        .filter(n => !n.read)
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('freelance_notifications')
        .update({ read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [user?.id, notifications]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const { error } = await supabase
          .from('freelance_notifications')
          .delete()
          .eq('id', notificationId);

        if (error) throw error;

        const isUnread = notifications.find(n => n.id === notificationId)?.read === false;

        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));

        if (isUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } catch (err) {
        console.error('Error deleting notification:', err);
      }
    },
    [notifications]
  );

  const clearAll = useCallback(async () => {
    try {
      if (!user?.id) return;

      const { error } = await supabase
        .from('freelance_notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
};
