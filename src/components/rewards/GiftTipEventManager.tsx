import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { giftTipNotificationService, GiftNotification } from '@/services/giftTipNotificationService';
import GiftCelebrationOverlay from './GiftCelebrationOverlay';

interface QueuedCelebration {
  notification: GiftNotification;
  id: string;
}

export const GiftTipEventManager: React.FC = () => {
  const { user } = useAuth();
  const [celebrations, setCelebrations] = useState<QueuedCelebration[]>([]);

  const handleNotification = useCallback((notification: GiftNotification) => {
    // Only show celebrations for received gifts/tips
    if (notification.type === 'gift_received' || notification.type === 'tip_received') {
      setCelebrations((prev) => [
        ...prev,
        { notification, id: `${notification.id}_${Date.now()}` },
      ]);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to notification events from the service
    const unsubscribe = giftTipNotificationService.onNotification(handleNotification);

    // Also listen for custom celebration events
    const handleCelebrationEvent = (event: Event) => {
      const customEvent = event as CustomEvent<GiftNotification>;
      if (customEvent.detail) {
        handleNotification(customEvent.detail);
      }
    };

    window.addEventListener('giftTipCelebration', handleCelebrationEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('giftTipCelebration', handleCelebrationEvent);
    };
  }, [user?.id, handleNotification]);

  const handleCelebrationComplete = useCallback((id: string) => {
    setCelebrations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <>
      {celebrations.map((celebration) => (
        <GiftCelebrationOverlay
          key={celebration.id}
          notification={celebration.notification}
          onComplete={() => handleCelebrationComplete(celebration.id)}
        />
      ))}
    </>
  );
};

export default GiftTipEventManager;
