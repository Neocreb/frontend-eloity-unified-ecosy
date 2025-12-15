// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreVertical,
  Archive,
  Bell,
  BellOff,
  Trash2,
  Pin,
  PinOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { chatPersistenceService } from "@/services/chatPersistenceService";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface ChatThread {
  id: string;
  name?: string;
  groupName?: string;
  type: "direct" | "group";
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  avatar?: string;
  isPinned?: boolean;
  isMuted?: boolean;
}

interface ChatListSidebarProps {
  onSelectChat?: (conversationId: string) => void;
  selectedChatId?: string;
  className?: string;
}

export const ChatListSidebar: React.FC<ChatListSidebarProps> = ({
  onSelectChat,
  selectedChatId,
  className,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatThread[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ChatThread[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const convs = await chatPersistenceService.getConversations();
      
      // Sort by last activity
      const sorted = (convs || []).sort((a, b) => {
        const aTime = new Date(a.lastMessageAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.lastMessageAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      });

      setConversations(sorted);
      setFilteredConversations(sorted);
    } catch (err) {
      console.error("Error loading conversations:", err);
      setError("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter conversations based on search
  useEffect(() => {
    const filtered = conversations.filter((conv) => {
      const searchLower = searchQuery.toLowerCase();
      const name = (conv.groupName || conv.name || "User").toLowerCase();
      const lastMsg = (conv.lastMessage || "").toLowerCase();
      return name.includes(searchLower) || lastMsg.includes(searchLower);
    });
    setFilteredConversations(filtered);
  }, [searchQuery, conversations]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Handle conversation selection
  const handleSelectChat = (conversationId: string) => {
    if (onSelectChat) {
      onSelectChat(conversationId);
    } else {
      navigate(`/app/chat/${conversationId}`);
    }
  };

  // Handle archive conversation
  const handleArchiveConversation = async (conversationId: string) => {
    try {
      await chatPersistenceService.archiveConversation(conversationId);
      setConversations((prev) =>
        prev.filter((conv) => conv.id !== conversationId)
      );
    } catch (err) {
      console.error("Error archiving conversation:", err);
    }
  };

  // Handle mute/unmute
  const handleToggleMute = async (conversationId: string, isMuted: boolean) => {
    try {
      if (isMuted) {
        await chatPersistenceService.unmuteConversation(conversationId);
      } else {
        await chatPersistenceService.muteConversation(conversationId);
      }
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, isMuted: !isMuted } : conv
        )
      );
    } catch (err) {
      console.error("Error toggling mute:", err);
    }
  };

  // Pinned conversations
  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const unpinnedConversations = filteredConversations.filter((c) => !c.isPinned);

  return (
    <div className={cn("flex flex-col h-full bg-white border-r border-gray-200", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Messages</h2>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => navigate("/app/chat/new")}
            title="New conversation"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full border-gray-300"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
              <p className="text-sm text-gray-500">Loading conversations...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-red-500">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={loadConversations}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="mb-2 text-4xl">💬</div>
              <p className="text-sm text-gray-500">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Pinned conversations */}
            {pinnedConversations.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Pinned
                </div>
                <div className="space-y-1 px-2">
                  {pinnedConversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isSelected={selectedChatId === conversation.id}
                      onSelect={handleSelectChat}
                      onArchive={handleArchiveConversation}
                      onToggleMute={handleToggleMute}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Unpinned conversations */}
            {unpinnedConversations.length > 0 && (
              <div>
                {pinnedConversations.length > 0 && (
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    All Messages
                  </div>
                )}
                <div className="space-y-1 px-2">
                  {unpinnedConversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isSelected={selectedChatId === conversation.id}
                      onSelect={handleSelectChat}
                      onArchive={handleArchiveConversation}
                      onToggleMute={handleToggleMute}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface ConversationItemProps {
  conversation: ChatThread;
  isSelected: boolean;
  onSelect: (conversationId: string) => void;
  onArchive: (conversationId: string) => void;
  onToggleMute: (conversationId: string, isMuted: boolean) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onSelect,
  onArchive,
  onToggleMute,
}) => {
  const displayName = conversation.groupName || conversation.name || "User";
  const lastMessageTime = conversation.lastMessageAt
    ? format(new Date(conversation.lastMessageAt), "HH:mm")
    : "";

  return (
    <button
      onClick={() => onSelect(conversation.id)}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
        isSelected
          ? "bg-blue-50 border border-blue-200"
          : "hover:bg-gray-50 border border-transparent"
      )}
    >
      {/* Avatar */}
      <Avatar className="h-12 w-12 flex-shrink-0">
        <AvatarImage
          src={conversation.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`}
        />
        <AvatarFallback>
          {displayName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Conversation info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className={cn(
            "font-semibold truncate",
            conversation.unreadCount ? "text-gray-900" : "text-gray-700"
          )}>
            {displayName}
          </h3>
          <span className="text-xs text-gray-500 flex-shrink-0">
            {lastMessageTime}
          </span>
        </div>
        <p className={cn(
          "text-sm truncate",
          conversation.unreadCount
            ? "text-gray-700 font-medium"
            : "text-gray-500"
        )}>
          {conversation.lastMessage || "No messages yet"}
        </p>
      </div>

      {/* Unread badge + actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {conversation.unreadCount && conversation.unreadCount > 0 && (
          <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">
            {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
          </div>
        )}

        {/* Dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              <Pin className="mr-2 h-4 w-4" />
              Pin conversation
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute(conversation.id, conversation.isMuted || false);
              }}
            >
              {conversation.isMuted ? (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Unmute
                </>
              ) : (
                <>
                  <BellOff className="mr-2 h-4 w-4" />
                  Mute
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onArchive(conversation.id);
              }}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                // Delete implementation would go here
              }}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </button>
  );
};

export default ChatListSidebar;
