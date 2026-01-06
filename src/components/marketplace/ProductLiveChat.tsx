import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Send, X, AlertCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { chatService } from "@/services/chatService";
import { cn } from "@/lib/utils";

interface ProductLiveChatProps {
  productId: string;
  productName: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  className?: string;
  onChatStart?: (threadId: string) => void;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  type: "text" | "question" | "offer";
}

/**
 * Product Live Chat Component
 * Integrates with the existing chat system to enable quick seller contact
 * from product detail pages without navigating away
 */
export const ProductLiveChat: React.FC<ProductLiveChatProps> = ({
  productId,
  productName,
  sellerId,
  sellerName,
  sellerAvatar,
  className,
  onChatStart,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Chat state
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatThreadId, setChatThreadId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [messageType, setMessageType] = useState<"text" | "question" | "offer">(
    "text"
  );

  // Load existing chat thread if available
  useEffect(() => {
    const loadExistingChat = async () => {
      if (!user?.id || !sellerId || !isOpen) return;

      try {
        // Try to find existing chat thread with seller
        const threads = await chatService.getChatThreads({
          type: "all",
        });

        const existingThread = threads.find(
          (thread) =>
            thread.participants.includes(user.id) &&
            thread.participants.includes(sellerId) &&
            thread.context?.productId === productId
        );

        if (existingThread) {
          setChatThreadId(existingThread.id);
          // Load messages
          const existingMessages = await chatService.getMessages(
            existingThread.id,
            10
          );
          setMessages(
            existingMessages.map((msg: any) => ({
              id: msg.id,
              content: msg.content,
              senderId: msg.senderId,
              timestamp: new Date(msg.createdAt),
              type: "text",
            }))
          );
        }
      } catch (error) {
        console.error("Error loading existing chat:", error);
      }
    };

    loadExistingChat();
  }, [user?.id, sellerId, productId, isOpen]);

  // Start new chat or use existing
  const startChat = async () => {
    if (!user?.id || !sellerId) {
      toast({
        title: "Error",
        description: "You must be logged in to chat with sellers",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      if (!chatThreadId) {
        // Create new chat thread
        const newThread = await chatService.createChatThread({
          participantIds: [user.id, sellerId],
          context: {
            type: "product",
            productId,
            productName,
          },
        });

        setChatThreadId(newThread.id);
        if (onChatStart) {
          onChatStart(newThread.id);
        }

        // Add welcome message
        const welcomeMessage = `Hi ${sellerName}! I'm interested in "${productName}". Do you have any questions about this product?`;
        setMessages([
          {
            id: "welcome",
            content: welcomeMessage,
            senderId: user.id,
            timestamp: new Date(),
            type: "question",
          },
        ]);

        toast({
          title: "Chat Started",
          description: `Connected with ${sellerName}`,
        });
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      toast({
        title: "Error",
        description: "Failed to start chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!messageInput.trim() || !user?.id || !chatThreadId) return;

    const newMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageInput,
      senderId: user.id,
      timestamp: new Date(),
      type: messageType,
    };

    try {
      setLoading(true);
      setMessages((prev) => [...prev, newMessage]);
      setMessageInput("");

      // Send via chat service
      await chatService.sendMessage({
        threadId: chatThreadId,
        content: messageInput,
        type: messageType === "text" ? "text" : messageType,
      });

      // Simulate seller typing
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);

      toast({
        title: "Message Sent",
        description: "Your message has been delivered",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove failed message
      setMessages((prev) => prev.filter((m) => m.id !== newMessage.id));
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Open full chat interface
  const openFullChat = () => {
    if (chatThreadId) {
      navigate(`/messages/${chatThreadId}`);
    } else {
      startChat().then(() => {
        setTimeout(() => {
          if (chatThreadId) {
            navigate(`/messages/${chatThreadId}`);
          }
        }, 500);
      });
    }
  };

  return (
    <div className={cn("", className)}>
      {/* Chat Button */}
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className="w-full flex items-center gap-2 sm:w-auto"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Chat with Seller</span>
          <span className="sm:hidden">Chat</span>
        </Button>
      ) : null}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2">
          <CardHeader className="border-b p-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={sellerAvatar} alt={sellerName} />
                <AvatarFallback>{sellerName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm">{sellerName}</CardTitle>
                <p className="text-xs text-gray-500">
                  {isTyping ? "typing..." : "Online"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Messages Area */}
            <div className="h-64 overflow-y-auto space-y-3 pr-2">
              {!chatThreadId ? (
                <div className="h-full flex items-center justify-center text-center">
                  <div className="space-y-2">
                    <MessageCircle className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">
                      Start a conversation with {sellerName}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.senderId === user?.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          msg.senderId === user?.id
                            ? "bg-primary text-white rounded-br-none"
                            : "bg-gray-200 text-gray-900 rounded-bl-none"
                        }`}
                      >
                        {msg.type !== "text" && (
                          <Badge
                            variant="secondary"
                            className="mb-1 text-xs capitalize"
                          >
                            {msg.type}
                          </Badge>
                        )}
                        <p className="break-words">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-200 text-gray-900 px-3 py-2 rounded-lg">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Error State */}
            {!user?.id && (
              <div className="flex gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-yellow-800">
                  <p className="font-medium">Login Required</p>
                  <p>Sign in to chat with sellers</p>
                </div>
              </div>
            )}

            {/* Message Type Selector */}
            {chatThreadId && (
              <div className="flex gap-1 pt-2">
                {[
                  { type: "text", label: "Message" },
                  { type: "question", label: "Question" },
                  { type: "offer", label: "Offer" },
                ].map((item) => (
                  <Button
                    key={item.type}
                    size="sm"
                    variant={messageType === item.type ? "default" : "outline"}
                    onClick={() =>
                      setMessageType(item.type as "text" | "question" | "offer")
                    }
                    className="text-xs"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="flex gap-2">
              {!chatThreadId ? (
                <Button
                  onClick={startChat}
                  disabled={loading || !user?.id}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Start Chat
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={loading}
                    className="text-sm"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!messageInput.trim() || loading}
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Full Chat Link */}
            {chatThreadId && (
              <Button
                onClick={openFullChat}
                variant="link"
                className="w-full text-xs"
              >
                Open Full Chat →
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductLiveChat;
