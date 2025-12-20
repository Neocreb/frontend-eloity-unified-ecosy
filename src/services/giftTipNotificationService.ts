import { toast } from 'sonner';

export interface GiftNotification {
  id: string;
  type: 'gift_sent' | 'gift_received' | 'tip_sent' | 'tip_received';
  senderName: string;
  senderAvatar?: string;
  recipientName: string;
  recipientAvatar?: string;
  amount: number;
  currency?: string;
  giftEmoji?: string;
  giftName?: string;
  message?: string;
  isAnonymous: boolean;
  timestamp: string;
  celebrationTriggered?: boolean;
}

class GiftTipNotificationService {
  private notifications: Map<string, GiftNotification> = new Map();
  private audioEnabled = true;
  private notificationCallbacks: Array<(notification: GiftNotification) => void> = [];

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const settings = localStorage.getItem('giftTipNotificationSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.audioEnabled = parsed.audioEnabled !== false;
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  setAudioEnabled(enabled: boolean) {
    this.audioEnabled = enabled;
    localStorage.setItem(
      'giftTipNotificationSettings',
      JSON.stringify({ audioEnabled: enabled })
    );
  }

  onNotification(callback: (notification: GiftNotification) => void) {
    this.notificationCallbacks.push(callback);
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(notification: GiftNotification) {
    this.notificationCallbacks.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }

  notifyGiftSent(notification: Omit<GiftNotification, 'id' | 'type' | 'celebrationTriggered'>) {
    const giftNotif: GiftNotification = {
      ...notification,
      id: `gift_sent_${Date.now()}`,
      type: 'gift_sent',
      celebrationTriggered: false,
    };

    this.notifications.set(giftNotif.id, giftNotif);
    this.notifyListeners(giftNotif);

    const message = notification.isAnonymous
      ? `🎁 You sent a gift to ${notification.recipientName}!`
      : `🎁 You sent a gift to ${notification.recipientName}!`;

    toast.success(message, {
      description: `${notification.giftEmoji || '🎁'} ${notification.giftName || 'Gift'} · ${notification.currency || 'USD'} ${notification.amount.toFixed(2)}`,
      duration: 4000,
    });

    this.playNotificationSound('gift-sent');
  }

  notifyGiftReceived(notification: Omit<GiftNotification, 'id' | 'type' | 'celebrationTriggered'>) {
    const giftNotif: GiftNotification = {
      ...notification,
      id: `gift_received_${Date.now()}`,
      type: 'gift_received',
      celebrationTriggered: false,
    };

    this.notifications.set(giftNotif.id, giftNotif);
    this.notifyListeners(giftNotif);

    const senderName = notification.isAnonymous ? 'An anonymous supporter' : notification.senderName;
    const message = `🎉 You received a gift from ${senderName}!`;

    toast.success(message, {
      description: `${notification.giftEmoji || '🎁'} ${notification.giftName || 'Gift'} · ${notification.currency || 'USD'} ${notification.amount.toFixed(2)}`,
      duration: 5000,
    });

    this.playNotificationSound('gift-received');
    this.triggerCelebration(giftNotif);
  }

  notifyTipSent(notification: Omit<GiftNotification, 'id' | 'type' | 'giftEmoji' | 'giftName' | 'celebrationTriggered'>) {
    const tipNotif: GiftNotification = {
      ...notification,
      id: `tip_sent_${Date.now()}`,
      type: 'tip_sent',
      giftEmoji: '💰',
      giftName: 'Tip',
      celebrationTriggered: false,
    };

    this.notifications.set(tipNotif.id, tipNotif);
    this.notifyListeners(tipNotif);

    const message = notification.isAnonymous
      ? `💰 You sent a tip to ${notification.recipientName}!`
      : `💰 You sent a tip to ${notification.recipientName}!`;

    toast.success(message, {
      description: `${notification.currency || 'USD'} ${notification.amount.toFixed(2)}${notification.message ? ` · "${notification.message}"` : ''}`,
      duration: 4000,
    });

    this.playNotificationSound('tip-sent');
  }

  notifyTipReceived(notification: Omit<GiftNotification, 'id' | 'type' | 'giftEmoji' | 'giftName' | 'celebrationTriggered'>) {
    const tipNotif: GiftNotification = {
      ...notification,
      id: `tip_received_${Date.now()}`,
      type: 'tip_received',
      giftEmoji: '💰',
      giftName: 'Tip',
      celebrationTriggered: false,
    };

    this.notifications.set(tipNotif.id, tipNotif);
    this.notifyListeners(tipNotif);

    const senderName = notification.isAnonymous ? 'An anonymous supporter' : notification.senderName;
    const message = `💰 You received a tip from ${senderName}!`;

    toast.success(message, {
      description: `${notification.currency || 'USD'} ${notification.amount.toFixed(2)}${notification.message ? ` · "${notification.message}"` : ''}`,
      duration: 5000,
    });

    this.playNotificationSound('tip-received');
    this.triggerCelebration(tipNotif);
  }

  private playNotificationSound(soundType: string) {
    if (!this.audioEnabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      switch (soundType) {
        case 'gift-received':
          // Celebratory ascending tones
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.5);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
          break;

        case 'tip-received':
          // Cheerful double beep
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.1);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);

          const oscillator2 = audioContext.createOscillator();
          oscillator2.connect(gainNode);
          oscillator2.frequency.setValueAtTime(1046.5, audioContext.currentTime + 0.15);
          oscillator2.start(audioContext.currentTime + 0.15);
          oscillator2.stop(audioContext.currentTime + 0.25);
          break;

        case 'gift-sent':
        case 'tip-sent':
          // Subtle confirmation tone
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.2);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
          break;
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  private triggerCelebration(notification: GiftNotification) {
    if (notification.celebrationTriggered) return;

    try {
      // Dispatch custom event for celebration animations
      const event = new CustomEvent('giftTipCelebration', {
        detail: notification,
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error triggering celebration:', error);
    }
  }

  getNotification(id: string): GiftNotification | undefined {
    return this.notifications.get(id);
  }

  getAllNotifications(): GiftNotification[] {
    return Array.from(this.notifications.values());
  }

  clearNotification(id: string) {
    this.notifications.delete(id);
  }

  clearAllNotifications() {
    this.notifications.clear();
  }

  // Utility method to format notification message
  formatNotificationMessage(notification: GiftNotification): string {
    switch (notification.type) {
      case 'gift_sent':
        return `Sent ${notification.giftName} to ${notification.recipientName}`;
      case 'gift_received':
        return `Received ${notification.giftName} from ${notification.isAnonymous ? 'Anonymous' : notification.senderName}`;
      case 'tip_sent':
        return `Sent $${notification.amount.toFixed(2)} tip to ${notification.recipientName}`;
      case 'tip_received':
        return `Received $${notification.amount.toFixed(2)} tip from ${notification.isAnonymous ? 'Anonymous' : notification.senderName}`;
      default:
        return 'Gift/Tip notification';
    }
  }
}

export const giftTipNotificationService = new GiftTipNotificationService();
