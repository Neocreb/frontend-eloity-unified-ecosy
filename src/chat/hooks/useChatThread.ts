import { useState, useEffect, useCallback, useRef } from "react";
import { ChatThread, ChatMessage, ChatFilter } from "@/types/chat";
import { chatPersistenceService, realtimeService } from "@/services/chatPersistenceService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const useChatThread = (threadId?: string) => {
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const readReceiptsRef = useRef<Map<string, string[]>>(new Map());

  // Load thread data
  const loadThread = useCallback(async () => {
    if (!threadId) return;

    try {
      setLoading(true);
      setError(null);

      const threadData = await chatPersistenceService.getConversation(threadId);
      if (threadData) {
        setThread(threadData);

        // Mark thread as read
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          await chatPersistenceService.markConversationAsRead(
            threadId,
            lastMessage.id
          );
        }
      } else {
        setError("Chat thread not found");
      }
    } catch (err) {
      setError("Failed to load chat thread");
      console.error("Error loading thread:", err);
    } finally {
      setLoading(false);
    }
  }, [threadId, messages]);

  // Load messages
  const loadMessages = useCallback(
    async (offset: number = 0) => {
      if (!threadId) return;

      try {
        setLoading(offset === 0);
        const newMessages = await chatPersistenceService.getMessages(
          threadId,
          50,
          offset
        );

        if (offset === 0) {
          setMessages(newMessages);
        } else {
          setMessages((prev) => [...newMessages, ...prev]);
        }

        setHasMore(newMessages.length === 50);
      } catch (err) {
        setError("Failed to load messages");
        console.error("Error loading messages:", err);
      } finally {
        setLoading(false);
      }
    },
    [threadId]
  );

  // Send message
  const sendMessage = useCallback(
    async (
      content: string,
      attachments?: string[],
      replyTo?: string,
      messageType?: "text" | "image" | "file" | "voice",
      metadata?: any
    ): Promise<ChatMessage | null> => {
      if (!threadId || !content.trim()) return null;

      try {
        const newMessage = await chatPersistenceService.sendMessage(threadId, content.trim(), {
          messageType: messageType || "text",
          attachments,
          replyToId: replyTo,
          metadata,
        });

        if (newMessage) {
          // Add message to local state
          setMessages((prev) => [...prev, newMessage]);

          // Update thread last message
          if (thread) {
            setThread((prev) =>
              prev
                ? {
                    ...prev,
                    lastMessage: content,
                    lastMessageAt: newMessage.timestamp,
                    updatedAt: newMessage.timestamp,
                  }
                : null
            );
          }

          return newMessage;
        }

        return null;
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
        console.error("Error sending message:", err);
        return null;
      }
    },
    [threadId, thread, toast]
  );

  // Upload and send file
  const sendFile = useCallback(
    async (file: File): Promise<ChatMessage | null> => {
      if (!threadId) return null;

      try {
        toast({
          title: "Uploading...",
          description: `Uploading ${file.name}`,
        });

        const fileUrl = await chatPersistenceService.uploadFile(file);

        const newMessage = await chatPersistenceService.sendMessage(
          threadId,
          `📎 ${file.name}`,
          {
            messageType: file.type.startsWith("image/") ? "image" : "file",
            attachments: [fileUrl],
          }
        );

        if (newMessage) {
          setMessages((prev) => [...prev, newMessage]);

          toast({
            title: "Success",
            description: "File uploaded successfully",
          });

          return newMessage;
        }

        return null;
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to upload file",
          variant: "destructive",
        });
        console.error("Error uploading file:", err);
        return null;
      }
    },
    [threadId, toast]
  );

  // Add reaction to message
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      await chatPersistenceService.addReaction(messageId, emoji);

      // Update local message state
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            const reactions = msg.reactions || {};
            if (!reactions[emoji]) {
              reactions[emoji] = [];
            }
            if (!reactions[emoji].includes(user?.id || "")) {
              reactions[emoji].push(user?.id || "");
            }
            return { ...msg, reactions };
          }
          return msg;
        })
      );
    } catch (err) {
      console.error("Error adding reaction:", err);
    }
  }, [user?.id]);

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        const success = await chatPersistenceService.deleteMessage(messageId);

        if (success) {
          setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
          toast({
            title: "Message deleted",
            description: "Message has been removed",
          });
        } else {
          toast({
            title: "Error",
            description: "Unable to delete message",
            variant: "destructive",
          });
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to delete message",
          variant: "destructive",
        });
        console.error("Error deleting message:", err);
      }
    },
    [toast]
  );

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(() => {
    if (!loading && hasMore) {
      loadMessages(messages.length);
    }
  }, [loading, hasMore, messages.length, loadMessages]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(() => {
    if (threadId) {
      chatPersistenceService.sendTypingIndicator(threadId);
    }
  }, [threadId]);

  // Mark as read
  const markAsRead = useCallback(async () => {
    if (!threadId || messages.length === 0) return;

    try {
      const lastMessage = messages[messages.length - 1];
      await chatPersistenceService.markConversationAsRead(threadId, lastMessage.id);
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  }, [threadId, messages]);

  // Initialize
  useEffect(() => {
    if (threadId) {
      loadThread();
      loadMessages();
    } else {
      setThread(null);
      setMessages([]);
    }
  }, [threadId, loadThread, loadMessages]);

  // Mark as read when messages load or user focuses window
  useEffect(() => {
    const handleFocus = () => {
      markAsRead();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [markAsRead]);

  return {
    thread,
    messages,
    loading,
    error,
    hasMore,
    sendMessage,
    sendFile,
    addReaction,
    deleteMessage,
    loadMoreMessages,
    sendTypingIndicator,
    markAsRead,
    refresh: () => {
      loadThread();
      loadMessages();
    },
  };
};

export const useChatThreads = (filter?: ChatFilter) => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const threadsData = await chatPersistenceService.getConversations(filter);
      setThreads(threadsData);
    } catch (err) {
      setError("Failed to load chat threads");
      console.error("Error loading threads:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  return {
    threads,
    loading,
    error,
    refresh: loadThreads,
  };
};
