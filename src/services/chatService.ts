// @ts-nocheck
import {
  ChatThread,
  ChatMessage,
  StartChatRequest,
  SendMessageRequest,
  ChatFilter,
  ChatNotification,
  TypingIndicator,
} from "@/types/chat";
import { generateThreadId, generateMessageId } from "@/chat/utils/chatHelpers";
import { chatPersistenceService } from "./chatPersistenceService";
import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// CHAT SERVICE WITH FULL PERSISTENCE
// ============================================================================
// This service now uses the backend API for all operations
// All data persists to the database with real-time updates
// ============================================================================

export const chatService = {
  // Get all chat threads for a user
  async getChatThreads(filter?: ChatFilter): Promise<ChatThread[]> {
    try {
      return await chatPersistenceService.getConversations(filter);
    } catch (error) {
      console.error("Error fetching chat threads:", error);
      return [];
    }
  },

  // Get a specific chat thread
  async getChatThread(threadId: string): Promise<ChatThread | null> {
    try {
      return await chatPersistenceService.getConversation(threadId);
    } catch (error) {
      console.error("Error fetching chat thread:", error);
      return null;
    }
  },

  // Create a new chat thread
  async createChatThread(request: StartChatRequest): Promise<ChatThread> {
    try {
      const thread = await chatPersistenceService.createConversation(request);
      if (!thread) throw new Error("Failed to create conversation");
      return thread;
    } catch (error) {
      console.error("Error creating chat thread:", error);
      throw error;
    }
  },

  // Create a group chat thread
  async createGroupChatThread(request: StartChatRequest): Promise<ChatThread> {
    return this.createChatThread({ ...request, groupName: request.groupName });
  },

  // Get messages for a thread
  async getMessages(
    threadId: string,
    limit: number = 50,
    offset: number = 0,
    currentUserId?: string,
  ): Promise<ChatMessage[]> {
    try {
      return await chatPersistenceService.getMessages(threadId, limit, offset);
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  },

  // Send a message
  async sendMessage(request: SendMessageRequest & { currentUserId?: string }): Promise<ChatMessage> {
    try {
      const message = await chatPersistenceService.sendMessage(
        request.threadId,
        request.content,
        {
          messageType: request.messageType,
          attachments: request.attachments,
          replyToId: request.replyTo,
          metadata: request.metadata,
        }
      );

      if (!message) throw new Error("Failed to send message");
      return message;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // Mark messages as read
  async markAsRead(threadId: string, userId: string): Promise<void> {
    try {
      await chatPersistenceService.markConversationAsRead(threadId, userId);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  },

  // Get notifications
  async getNotifications(userId: string): Promise<ChatNotification[]> {
    try {
      const threads = await chatPersistenceService.getConversations();
      const notifications: ChatNotification[] = [];

      for (const thread of threads) {
        if (thread.unreadCount && thread.unreadCount > 0) {
          const messages = await chatPersistenceService.getMessages(thread.id, 1);
          if (messages.length > 0) {
            const msg = messages[0];
            notifications.push({
              id: msg.id,
              threadId: thread.id,
              senderId: msg.senderId,
              senderName: thread.groupName || "User",
              message: msg.content,
              timestamp: msg.timestamp,
              type: thread.type,
              contextInfo: thread.groupName || "",
              isRead: (msg.readBy || []).includes(userId),
            });
          }
        }
      }

      return notifications;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  },

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await chatPersistenceService.markMessageAsRead(notificationId);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  },

  // Search messages
  async searchMessages(query: string, threadId?: string): Promise<ChatMessage[]> {
    try {
      return await chatPersistenceService.searchMessages(query, threadId);
    } catch (error) {
      console.error("Error searching messages:", error);
      return [];
    }
  },

  // Get typing indicator
  async getTypingIndicator(threadId: string): Promise<TypingIndicator[]> {
    try {
      const indicators = await chatPersistenceService.getTypingIndicators(threadId);
      return indicators.map((ind: any) => ({
        userId: ind.userId,
        userName: ind.username || "User",
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.error("Error fetching typing indicator:", error);
      return [];
    }
  },

  // Send typing indicator
  async sendTypingIndicator(threadId: string, userId: string): Promise<void> {
    try {
      await chatPersistenceService.sendTypingIndicator(threadId);
    } catch (error) {
      console.error("Error sending typing indicator:", error);
    }
  },

  // Add reaction to message
  async addReaction(messageId: string, emoji: string, userId: string): Promise<void> {
    try {
      await chatPersistenceService.addReaction(messageId, emoji);
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  },

  // Remove reaction from message
  async removeReaction(messageId: string, emoji: string, userId: string): Promise<void> {
    try {
      await chatPersistenceService.removeReaction(messageId, emoji);
    } catch (error) {
      console.error("Error removing reaction:", error);
    }
  },

  // Delete message
  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    try {
      return await chatPersistenceService.deleteMessage(messageId);
    } catch (error) {
      console.error("Error deleting message:", error);
      return false;
    }
  },

  // Upload attachment
  async uploadAttachment(file: File): Promise<string> {
    try {
      return await chatPersistenceService.uploadFile(file);
    } catch (error) {
      console.error("Error uploading attachment:", error);
      throw error;
    }
  },

  // Archive conversation
  async archiveConversation(threadId: string): Promise<boolean> {
    try {
      return await chatPersistenceService.archiveConversation(threadId);
    } catch (error) {
      console.error("Error archiving conversation:", error);
      return false;
    }
  },

  // Mute conversation
  async muteConversation(threadId: string): Promise<boolean> {
    try {
      return await chatPersistenceService.muteConversation(threadId);
    } catch (error) {
      console.error("Error muting conversation:", error);
      return false;
    }
  },

  // Unmute conversation
  async unmuteConversation(threadId: string): Promise<boolean> {
    try {
      return await chatPersistenceService.unmuteConversation(threadId);
    } catch (error) {
      console.error("Error unmuting conversation:", error);
      return false;
    }
  },

  // Update message
  async updateMessage(messageId: string, content: string): Promise<ChatMessage | null> {
    try {
      return await chatPersistenceService.updateMessage(messageId, content);
    } catch (error) {
      console.error("Error updating message:", error);
      return null;
    }
  },

  // Pin message
  async pinMessage(messageId: string): Promise<boolean> {
    try {
      return await chatPersistenceService.updateMessage(messageId, "");
      return true;
    } catch (error) {
      console.error("Error pinning message:", error);
      return false;
    }
  },

  // Export conversation
  async exportConversation(threadId: string, format: "json" | "csv" = "json"): Promise<string> {
    try {
      const messages = await this.getMessages(threadId, 1000);
      
      if (format === "json") {
        return JSON.stringify(messages, null, 2);
      } else {
        // CSV format
        const headers = ["ID", "Sender", "Content", "Timestamp", "Type"];
        const rows = messages.map((msg) => [
          msg.id,
          msg.senderId,
          msg.content.replace(/"/g, '""'), // Escape quotes
          msg.timestamp,
          msg.messageType,
        ]);
        
        const csv = [
          headers.join(","),
          ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");
        
        return csv;
      }
    } catch (error) {
      console.error("Error exporting conversation:", error);
      throw error;
    }
  },

  // Clear conversation
  async clearConversation(threadId: string): Promise<boolean> {
    try {
      const messages = await this.getMessages(threadId, 1000);
      for (const message of messages) {
        await chatPersistenceService.deleteMessage(message.id);
      }
      return true;
    } catch (error) {
      console.error("Error clearing conversation:", error);
      return false;
    }
  },

  // Get conversation settings
  async getConversationSettings(threadId: string): Promise<any> {
    try {
      const thread = await this.getChatThread(threadId);
      return thread?.contextData || {};
    } catch (error) {
      console.error("Error fetching conversation settings:", error);
      return {};
    }
  },

  // Update conversation settings
  async updateConversationSettings(threadId: string, settings: any): Promise<boolean> {
    try {
      return await chatPersistenceService.updateConversation(threadId, {
        settings,
      });
    } catch (error) {
      console.error("Error updating conversation settings:", error);
      return false;
    }
  },
};

export default chatService;
