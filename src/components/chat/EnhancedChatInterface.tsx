// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Phone,
  Video,
  Info,
  Search,
  MoreVertical,
  Zap,
} from "lucide-react";
import { useChatThread } from "@/chat/hooks/useChatThread";
import { useSendMessage } from "@/chat/hooks/useSendMessage";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { EnhancedChatInput } from "@/components/chat/EnhancedChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { chatPersistenceService } from "@/services/chatPersistenceService";
import { cn } from "@/lib/utils";

interface EnhancedChatInterfaceProps {
  threadId?: string;
  recipientName?: string;
}

export const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  threadId: propThreadId,
  recipientName: propRecipientName,
}) => {
  const { threadId: paramThreadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const conversationId = propThreadId || paramThreadId;

  // State
  const [messageInput, setMessageInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recipientOnline, setRecipientOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Chat hooks
  const {
    thread,
    messages,
    loading,
    error,
    sendMessage,
    sendFile,
    addReaction,
    deleteMessage,
  } = useChatThread(conversationId);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    try {
      const content = messageInput.trim();
      setMessageInput("");
      await sendMessage(content);
      scrollToBottom();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  // Handle file upload
  const handleFileSelect = async (file: File) => {
    try {
      toast({
        title: "Uploading...",
        description: `Uploading ${file.name}...`,
      });
      await sendFile(file);
      scrollToBottom();
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      toast({
        title: "Success",
        description: "Message deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  // Handle reaction
  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await addReaction(messageId, emoji);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      });
    }
  };

  // Debounced typing indicator
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const handleTyping = useCallback(() => {
    if (conversationId) {
      chatPersistenceService.sendTypingIndicator(conversationId);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout for periodic updates
      typingTimeoutRef.current = setTimeout(() => {
        if (conversationId && messageInput.trim()) {
          chatPersistenceService.sendTypingIndicator(conversationId);
        }
      }, 2000);
    }
  }, [conversationId, messageInput]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Filter messages by search
  const filteredMessages = searchQuery
    ? messages.filter((msg) =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  const recipientInfo = thread?.participants?.find((p) => p !== user?.id);

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* ========== HEADER ========== */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/app/chat")}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Recipient Avatar & Info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  thread?.groupName ||
                    propRecipientName ||
                    "User"
                )}&background=random`}
              />
              <AvatarFallback>
                {(thread?.groupName || propRecipientName || "U")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col">
              <h2 className="text-sm font-semibold">
                {thread?.groupName || propRecipientName || "Conversation"}
              </h2>
              <p className="text-xs text-gray-500">
                {recipientOnline ? "Active now" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9"
            title="Voice call"
          >
            <Phone className="h-5 w-5 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9"
            title="Video call"
          >
            <Video className="h-5 w-5 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchOpen(!searchOpen)}
            className="h-9 w-9"
            title="Search messages"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9"
            title="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search Bar (conditional) */}
      {searchOpen && (
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      )}

      {/* ========== MESSAGES AREA ========== */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-white px-4 py-4 sm:px-6"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
              <p className="text-sm text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-2 text-4xl">💬</div>
              <p className="text-sm text-gray-500">
                {searchQuery ? "No messages found" : "No messages yet"}
              </p>
              {!searchQuery && (
                <p className="mt-1 text-xs text-gray-400">
                  Start a conversation by sending a message
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMessages.map((message, index) => {
              const isUserMessage = message.senderId === user?.id;
              const showAvatar =
                index === 0 ||
                filteredMessages[index - 1]?.senderId !== message.senderId;

              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOwn={isUserMessage}
                  showAvatar={showAvatar}
                  currentUserId={user?.id}
                  recipientName={propRecipientName || thread?.groupName || "User"}
                  onReaction={handleReaction}
                  onDelete={handleDeleteMessage}
                />
              );
            })}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex gap-2 px-2 py-1">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>...</AvatarFallback>
                </Avatar>
                <TypingIndicator />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ========== INPUT AREA ========== */}
      <div className="border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <EnhancedChatInput
          value={messageInput}
          onChange={(value) => {
            setMessageInput(value);
            handleTyping();
          }}
          onSend={handleSendMessage}
          onFileSelect={handleFileSelect}
          isLoading={loading}
          placeholder="Type a message..."
        />
      </div>
    </div>
  );
};

export default EnhancedChatInterface;
