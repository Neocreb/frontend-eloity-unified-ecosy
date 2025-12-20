import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GiftNotification } from '@/services/giftTipNotificationService';

interface GiftCelebrationOverlayProps {
  notification: GiftNotification;
  onComplete?: () => void;
}

const Confetti = () => {
  const confettiPieces = Array.from({ length: 50 }, (_, i) => i);

  return (
    <>
      {confettiPieces.map((i) => (
        <motion.div
          key={i}
          className="fixed pointer-events-none"
          initial={{
            x: window.innerWidth / 2,
            y: -10,
            opacity: 1,
            rotate: 0,
          }}
          animate={{
            x: window.innerWidth / 2 + (Math.random() - 0.5) * 400,
            y: window.innerHeight + 10,
            opacity: 0,
            rotate: Math.random() * 720,
          }}
          transition={{
            duration: 2 + Math.random() * 1,
            ease: 'easeIn',
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: [
                '#ff6b6b',
                '#ffd43b',
                '#51cf66',
                '#1c7ed6',
                '#ff922b',
              ][Math.floor(Math.random() * 5)],
            }}
          />
        </motion.div>
      ))}
    </>
  );
};

const Sparkles = () => {
  const sparkles = Array.from({ length: 20 }, (_, i) => i);

  return (
    <>
      {sparkles.map((i) => (
        <motion.div
          key={i}
          className="fixed pointer-events-none"
          initial={{
            x: window.innerWidth / 2 + (Math.random() - 0.5) * 100,
            y: window.innerHeight / 2 + (Math.random() - 0.5) * 100,
            opacity: 1,
            scale: 1,
          }}
          animate={{
            x: window.innerWidth / 2 + (Math.random() - 0.5) * 300,
            y: window.innerHeight / 2 + (Math.random() - 0.5) * 300,
            opacity: 0,
            scale: 0,
          }}
          transition={{
            duration: 1.5 + Math.random() * 0.5,
            ease: 'easeOut',
          }}
        >
          <span className="text-2xl">✨</span>
        </motion.div>
      ))}
    </>
  );
};

export const GiftCelebrationOverlay: React.FC<GiftCelebrationOverlayProps> = ({
  notification,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const isReceived =
    notification.type === 'gift_received' || notification.type === 'tip_received';

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          {/* Background overlay */}
          <motion.div
            className="absolute inset-0 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: isReceived ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Confetti and sparkles for received gifts/tips */}
          {isReceived && (
            <>
              <Confetti />
              <Sparkles />
            </>
          )}

          {/* Main message/card */}
          <motion.div
            className="relative z-10 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-md mx-4"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 100,
              damping: 15,
            }}
          >
            {/* Header with emoji */}
            <motion.div
              className="text-6xl mb-4 text-center"
              animate={
                isReceived
                  ? { scale: [1, 1.2, 1], y: [0, -10, 0] }
                  : { rotate: [0, -5, 5, -5, 0] }
              }
              transition={{
                duration: 0.6,
                repeat: isReceived ? 2 : 1,
              }}
            >
              {notification.giftEmoji || '🎁'}
            </motion.div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-center mb-2 dark:text-white">
              {notification.type === 'gift_sent' && '🎁 Gift Sent!'}
              {notification.type === 'gift_received' && '🎉 Gift Received!'}
              {notification.type === 'tip_sent' && '💰 Tip Sent!'}
              {notification.type === 'tip_received' && '💰 Tip Received!'}
            </h3>

            {/* Details */}
            <div className="text-center text-gray-600 dark:text-gray-300 text-sm mb-4">
              {notification.type === 'gift_sent' && (
                <p>You sent {notification.giftName} to {notification.recipientName}</p>
              )}
              {notification.type === 'gift_received' && (
                <p>
                  From {notification.isAnonymous ? 'An anonymous supporter' : notification.senderName}
                </p>
              )}
              {notification.type === 'tip_sent' && (
                <p>You sent {notification.currency || 'USD'} {notification.amount.toFixed(2)} to {notification.recipientName}</p>
              )}
              {notification.type === 'tip_received' && (
                <p>
                  From {notification.isAnonymous ? 'An anonymous supporter' : notification.senderName}
                </p>
              )}
            </div>

            {/* Amount badge */}
            <motion.div
              className="text-center font-bold text-lg text-purple-600 dark:text-purple-400"
              animate={isReceived ? { y: [0, -5, 0] } : {}}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {notification.currency || 'USD'} {notification.amount.toFixed(2)}
            </motion.div>

            {/* Message if provided */}
            {notification.message && (
              <motion.p
                className="text-xs italic text-center text-gray-500 dark:text-gray-400 mt-4 px-2 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                "{notification.message}"
              </motion.p>
            )}
          </motion.div>

          {/* Floating hearts for received gifts */}
          {isReceived && (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={`heart-${i}`}
                  className="absolute text-2xl"
                  initial={{
                    x: window.innerWidth / 2 + (Math.random() - 0.5) * 50,
                    y: window.innerHeight / 2,
                    opacity: 1,
                  }}
                  animate={{
                    x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
                    y: window.innerHeight / 2 - 300,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                  }}
                >
                  ❤️
                </motion.div>
              ))}
            </>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};

export default GiftCelebrationOverlay;
