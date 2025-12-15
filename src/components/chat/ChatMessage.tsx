// @ts-nocheck
import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  CheckCheck,
  Copy,
  Reply,
  Trash2,
  MoreVertical,
  Download,
  Smile,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ChatMessageProps {
  message: any;
  isOwn: boolean;
  showAvatar: boolean;
  currentUserId?: string;
  onReply?: (message: any) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  recipientName?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isOwn,
  showAvatar,
  currentUserId,
  onReply,
  onDelete,
  onReaction,
  recipientName = "User",
}) => {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Determine read status based on read_by and delivered_to arrays
  const readByCount = message.readBy?.length || 0;
  const deliveredToCount = message.deliveredTo?.length || 0;
  let readStatus: "sent" | "delivered" | "read" = "sent";

  if (readByCount > 1) {
    readStatus = "read";
  } else if (deliveredToCount > 1) {
    readStatus = "delivered";
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id);
    }
  };

  // Sender info (for group chats)
  const senderName = message.senderName || "Unknown";
  const senderAvatar = message.senderAvatar;

  return (
    <div
      className={cn(
        "group flex gap-2 py-1",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {showAvatar && !isOwn ? (
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={senderAvatar || `https://ui-avatars.com/api/?name=${senderName}`}
            />
            <AvatarFallback>{senderName.charAt(0)}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-8 w-8" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
        {/* Sender name (for group chats) */}
        {!isOwn && showAvatar && message.senderName && (
          <span className="px-2 text-xs font-semibold text-gray-600">
            {senderName}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "max-w-xs rounded-lg px-4 py-2 text-sm sm:max-w-md md:max-w-lg lg:max-w-xl break-words",
            isOwn
              ? "rounded-br-none bg-blue-600 text-white"
              : "rounded-bl-none bg-gray-100 text-gray-900"
          )}
        >
          {/* Reply quote (if replying to another message) */}
          {message.replyTo && (
            <div
              className={cn(
                "mb-2 border-l-4 pl-2 py-1 text-xs opacity-75",
                isOwn ? "border-blue-400" : "border-gray-400"
              )}
            >
              <p className="font-semibold">{message.replyToSender}</p>
              <p className="truncate">{message.replyToContent}</p>
            </div>
          )}

          {/* Message text */}
          <p className="whitespace-pre-wrap">{message.content}</p>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment: any, idx: number) => (
                <div
                  key={idx}
                  className={cn(
                    "rounded p-2",
                    isOwn ? "bg-blue-700" : "bg-gray-200"
                  )}
                >
                  {attachment.type === "image" ? (
                    <img
                      src={attachment.url}
                      alt="attachment"
                      className="max-h-64 max-w-xs rounded"
                    />
                  ) : (
                    <a
                      href={attachment.url}
                      download
                      className="flex items-center gap-2 hover:underline"
                    >
                      <Download className="h-4 w-4" />
                      <span className="truncate text-xs">{attachment.name}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp + Read receipt */}
        <div
          className={cn(
            "flex items-center gap-1 px-2 text-xs text-gray-500",
            isOwn ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span>
            {format(new Date(message.timestamp), "HH:mm")}
          </span>
          {isOwn && (
            <>
              {isRead ? (
                <CheckCheck className="h-4 w-4 text-blue-600" title="Read" />
              ) : (
                <Check className="h-4 w-4" title="Sent" />
              )}
            </>
          )}
        </div>
      </div>

      {/* Action Menu */}
      {showActions && (
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isOwn ? "end" : "start"}
              className="w-48"
            >
              {onReply && (
                <DropdownMenuItem onClick={() => onReply(message)}>
                  <Reply className="mr-2 h-4 w-4" />
                  Reply
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                {copied ? "Copied!" : "Copy"}
              </DropdownMenuItem>
              {isOwn && onDelete && (
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
