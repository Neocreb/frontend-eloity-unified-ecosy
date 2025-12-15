// @ts-nocheck
import React from "react";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  typingUsers?: Array<{ id: string; name: string }>;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers = [],
  className = "",
}) => {
  const displayText =
    typingUsers.length === 1
      ? `${typingUsers[0].name} is typing...`
      : typingUsers.length > 1
        ? `${typingUsers.map((u) => u.name).join(", ")} are typing...`
        : "Someone is typing...";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex gap-1.5">
        {/* Animated dots */}
        <div className="flex h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="flex h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="flex h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span className="text-sm text-gray-500 italic">{displayText}</span>
    </div>
  );
};

export default TypingIndicator;
