import React, { useState } from 'react';
import { Heart, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReactionOption {
  type: string;
  emoji: string;
  label: string;
}

const REACTIONS: ReactionOption[] = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'haha', emoji: '😄', label: 'Haha' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'angry', emoji: '😠', label: 'Angry' },
  { type: 'fire', emoji: '🔥', label: 'Fire' },
];

interface ReactionPickerProps {
  onSelectReaction: (reactionType: string) => void;
  currentReaction?: string | null;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({
  onSelectReaction,
  currentReaction,
  className,
  showLabel = true,
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const emojiSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const currentReactionEmoji = REACTIONS.find(r => r.type === currentReaction)?.emoji;

  const handleReactionSelect = (reactionType: string) => {
    onSelectReaction(reactionType);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 h-auto transition-all duration-200',
          'hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md',
          currentReaction && 'text-red-500',
          sizeClasses[size]
        )}
        aria-label="Add reaction"
      >
        <span className={emojiSizeClasses[size]}>
          {currentReactionEmoji || '👍'}
        </span>
        {showLabel && (
          <span className="hidden sm:inline">
            {currentReaction ? REACTIONS.find(r => r.type === currentReaction)?.label : 'Like'}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Overlay to close picker */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Reaction Picker */}
          <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-2 z-40 flex gap-1 border border-gray-200 dark:border-gray-700">
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.type}
                onClick={() => handleReactionSelect(reaction.type)}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-1 rounded transition-all duration-200',
                  'hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-110',
                  currentReaction === reaction.type && 'bg-blue-100 dark:bg-blue-900',
                )}
                title={reaction.label}
              >
                <span className="text-2xl">{reaction.emoji}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {reaction.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ReactionPicker;
