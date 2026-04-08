import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Search,
  Filter,
  Star,
  Archive,
  Trash2,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  Plus,
  MoreVertical,
  Eye,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface CustomerMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  orderId?: string;
  productId?: string;
  productName?: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: "question" | "issue" | "inquiry" | "feedback";
  priority: "low" | "medium" | "high";
}

interface ConversationThread {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  messageCount: number;
  unreadCount: number;
  starred: boolean;
  archived: boolean;
  status: "open" | "pending" | "resolved" | "closed";
  messages: CustomerMessage[];
  relatedOrder?: {
    orderId: string;
    productName: string;
  };
}

interface SellerMessagesHubProps {
  sellerId: string;
  className?: string;
}

/**
 * Seller Messages Hub
 * Centralized messaging interface for sellers to manage customer communications
 * Integrates with the existing chat system
 */
export const SellerMessagesHub: React.FC<SellerMessagesHubProps> = ({
  sellerId,
  className,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State management
  const [conversations, setConversations] = useState<ConversationThread[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationThread | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "pending" | "resolved" | "closed">("all");
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "unread" | "starred">("recent");
  const [showCompose, setShowCompose] = useState(false);

  // Load conversations
  useEffect(() => {
    loadConversations();
    // Set up polling
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, [sellerId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      // Mock data - in production, fetch from API
      const mockConversations: ConversationThread[] = [
        {
          id: "conv-1",
          customerId: "cust-1",
          customerName: "John Smith",
          customerAvatar:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
          lastMessage: "When will this be back in stock?",
          lastMessageTime: new Date(Date.now() - 30 * 60 * 1000),
          messageCount: 3,
          unreadCount: 1,
          starred: false,
          archived: false,
          status: "open",
          relatedOrder: {
            orderId: "ORD-001",
            productName: "Wireless Headphones",
          },
          messages: [
            {
              id: "msg-1",
              senderId: "cust-1",
              senderName: "John Smith",
              message: "Hi, do you have this in blue?",
              timestamp: new Date(Date.now() - 60 * 60 * 1000),
              read: true,
              type: "inquiry",
              priority: "low",
            },
            {
              id: "msg-2",
              senderId: sellerId,
              senderName: "You",
              message: "Yes, we have blue available. Would you like me to reserve one?",
              timestamp: new Date(Date.now() - 45 * 60 * 1000),
              read: true,
              type: "question",
              priority: "low",
            },
            {
              id: "msg-3",
              senderId: "cust-1",
              senderName: "John Smith",
              message: "When will this be back in stock?",
              timestamp: new Date(Date.now() - 30 * 60 * 1000),
              read: false,
              type: "inquiry",
              priority: "medium",
            },
          ],
        },
        {
          id: "conv-2",
          customerId: "cust-2",
          customerName: "Sarah Johnson",
          customerAvatar:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
          lastMessage: "The product arrived damaged",
          lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
          messageCount: 5,
          unreadCount: 2,
          starred: true,
          archived: false,
          status: "pending",
          relatedOrder: {
            orderId: "ORD-002",
            productName: "Phone Case",
          },
          messages: [],
        },
        {
          id: "conv-3",
          customerId: "cust-3",
          customerName: "Mike Chen",
          lastMessage: "Thanks for the help!",
          lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
          messageCount: 4,
          unreadCount: 0,
          starred: false,
          archived: false,
          status: "resolved",
          relatedOrder: {
            orderId: "ORD-003",
            productName: "USB Cable",
          },
          messages: [],
        },
      ];

      setConversations(mockConversations);
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations
    .filter((conv) => {
      const matchesSearch = conv.customerName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || conv.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "unread":
          return b.unreadCount - a.unreadCount;
        case "starred":
          return b.starred ? 1 : -1;
        case "recent":
        default:
          return (
            new Date(b.lastMessageTime).getTime() -
            new Date(a.lastMessageTime).getTime()
          );
      }
    });

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || sendingMessage) return;

    try {
      setSendingMessage(true);

      // Add message to conversation
      const newMessage: CustomerMessage = {
        id: `msg-${Date.now()}`,
        senderId: sellerId,
        senderName: "You",
        message: messageInput,
        timestamp: new Date(),
        read: true,
        type: "inquiry",
        priority: "low",
      };

      setSelectedConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, newMessage],
              lastMessage: messageInput,
              lastMessageTime: new Date(),
            }
          : null
      );

      setMessageInput("");

      // Update in conversations list
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.id
            ? {
                ...conv,
                lastMessage: messageInput,
                lastMessageTime: new Date(),
              }
            : conv
        )
      );

      toast({
        title: "Message sent",
        description: "Your message has been delivered",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const toggleStar = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, starred: !conv.starred } : conv
      )
    );
  };

  const archiveConversation = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, archived: true } : conv
      )
    );
    setSelectedConversation(null);
    toast({
      title: "Archived",
      description: "Conversation has been archived",
    });
  };

  const updateConversationStatus = (
    conversationId: string,
    newStatus: ConversationThread["status"]
  ) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, status: newStatus } : conv
      )
    );
    toast({
      title: "Status updated",
      description: `Conversation marked as ${newStatus}`,
    });
  };

  const getStatusBadgeColor = (status: ConversationThread["status"]) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: ConversationThread["status"]) => {
    switch (status) {
      case "open":
        return <MessageCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4" />;
      case "closed":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const stats = {
    unread: conversations.reduce((sum, conv) => sum + conv.unreadCount, 0),
    pending: conversations.filter((c) => c.status === "pending").length,
    resolved: conversations.filter((c) => c.status === "resolved").length,
  };

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen", className)}>
      {/* Conversation List */}
      <div className="lg:col-span-1 flex flex-col border rounded-lg overflow-hidden bg-white">
        <CardHeader className="border-b pb-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Messages
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setShowCompose(true)}
                className="h-8 w-8 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-blue-50 p-2 rounded text-center">
                <p className="font-bold text-blue-600">{stats.unread}</p>
                <p className="text-blue-600">Unread</p>
              </div>
              <div className="bg-yellow-50 p-2 rounded text-center">
                <p className="font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-yellow-600">Pending</p>
              </div>
              <div className="bg-green-50 p-2 rounded text-center">
                <p className="font-bold text-green-600">{stats.resolved}</p>
                <p className="text-green-600">Resolved</p>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Search and Filters */}
        <div className="border-b p-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="h-8 text-sm flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="starred">Starred</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conversation List Items */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No conversations</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={cn(
                  "p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors",
                  selectedConversation?.id === conv.id && "bg-blue-50"
                )}
              >
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conv.customerAvatar} />
                    <AvatarFallback>
                      {conv.customerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm truncate">
                        {conv.customerName}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(conv.id);
                        }}
                        className="flex-shrink-0"
                      >
                        <Star
                          className={cn(
                            "w-4 h-4",
                            conv.starred
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          )}
                        />
                      </button>
                    </div>

                    <p className="text-xs text-gray-600 truncate mt-0.5">
                      {conv.lastMessage}
                    </p>

                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        className={cn("text-xs", getStatusBadgeColor(conv.status))}
                      >
                        {getStatusIcon(conv.status)}
                        <span className="ml-1">{conv.status}</span>
                      </Badge>
                      {conv.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Conversation Detail */}
      <div className="lg:col-span-2 flex flex-col border rounded-lg overflow-hidden bg-white">
        {selectedConversation ? (
          <>
            {/* Header */}
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversation.customerAvatar} />
                    <AvatarFallback>
                      {selectedConversation.customerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {selectedConversation.customerName}
                    </p>
                    {selectedConversation.relatedOrder && (
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3" />
                        Order: {selectedConversation.relatedOrder.orderId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          updateConversationStatus(selectedConversation.id, "open")
                        }
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Mark as Open
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          updateConversationStatus(
                            selectedConversation.id,
                            "pending"
                          )
                        }
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Mark as Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          updateConversationStatus(
                            selectedConversation.id,
                            "resolved"
                          )
                        }
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Resolved
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          archiveConversation(selectedConversation.id)
                        }
                        className="text-red-600"
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No messages yet</p>
                </div>
              ) : (
                selectedConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.senderId === sellerId ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-xs px-4 py-2 rounded-lg",
                        msg.senderId === sellerId
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-gray-200 text-gray-900 rounded-bl-none"
                      )}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="border-t p-4 space-y-2">
              <Textarea
                placeholder="Type your message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    sendMessage();
                  }
                }}
                className="resize-none text-sm"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || sendingMessage}
                  size="sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">
                Select a conversation to view details
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerMessagesHub;
