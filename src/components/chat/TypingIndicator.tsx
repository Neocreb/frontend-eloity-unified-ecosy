// @ts-nocheck
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TypingUser {
  id?: string;
  userId?: string;
  username?: string;
  name?: string;
  avatar?: string;
}

interface TypingIndicatorProps {
  typingUsers?: TypingUser[];
  className?: string;
  showAvatars?: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers = [],
  className = "",
  showAvatars = false,
}) => {
  if (typingUsers.length === 0) {
    return null;
  }

  const names = typingUsers
    .map((u) => u.name || u.username || u.id || "Someone")
    .slice(0, 3);

  const displayText =
    names.length === 1
      ? `${names[0]} is typing...`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing...`
        : `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]} are typing...`;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showAvatars && typingUsers.length > 0 && (
        <div className="flex -space-x-2">
          {typingUsers.slice(0, 3).map((user) => (
            <Avatar key={user.id || user.userId} className="h-6 w-6 border-2 border-white">
              <AvatarImage
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username || "U")}&size=24`}
              />
              <AvatarFallback className="text-xs">
                {(user.name || user.username || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {/* Animated dots */}
        <div
          className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>

      <span className="text-sm text-gray-500 italic">{displayText}</span>
    </div>
  );
};

export default TypingIndicator;
