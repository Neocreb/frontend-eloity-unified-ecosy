// @ts-nocheck
/**
 * Chat Persistence Service
 * Handles all database operations for chat system
 * Ensures messages are saved to Supabase and not lost
 */

import { supabase } from "@/integrations/supabase/client";
import { ChatMessage, ChatThread } from "@/types/chat";

export const chatPersistenceService = {
  // ============================================================================
  // CONVERSATION OPERATIONS
  // ============================================================================

  /**
   * Create a new conversation
   * @param participantIds - Array of user IDs in the conversation
   * @param type - 'direct' or 'group'
   * @param name - (Optional) Name for group conversations
   * @returns Conversation ID
   */
  async createConversation(
    participantIds: string[],
    type: "direct" | "group" = "direct",
    name?: string
  ): Promise<string> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({
          created_by: user.user.id,
          participants: participantIds,
          type,
          name,
          is_group: type === "group",
        })
        .select("id")
        .single();

      if (error) throw error;

      // Add participants
      for (const participantId of participantIds) {
        await supabase.from("chat_participants").insert({
          conversation_id: data.id,
          user_id: participantId,
        });
      }

      return data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  },

  /**
   * Get or create conversation between two users
   */
  async getOrCreateDirectConversation(otherUserId: string): Promise<string> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) throw new Error("Not authenticated");

      const currentUserId = user.user.id;

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from("chat_conversations")
        .select("id")
        .contains("participants", [currentUserId, otherUserId])
        .eq("type", "direct")
        .single();

      if (existing) {
        return existing.id;
      }

      // Create new conversation
      return await this.createConversation(
        [currentUserId, otherUserId],
        "direct"
      );
    } catch (error) {
      console.error("Error getting/creating conversation:", error);
      throw error;
    }
  },

  /**
   * Get conversation details
   */
  async getConversation(conversationId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select(
          `
          *,
          chat_participants(user_id, custom_name, muted, notifications_enabled)
        `
        )
        .eq("id", conversationId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching conversation:", error);
      throw error;
    }
  },

  /**
   * Get user's conversations list
   */
  async getUserConversations(userId: string, limit = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("conversation_with_last_message")
        .select("*")
        .contains("participants", [userId])
        .eq("is_archived", false)
        .order("last_activity", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return [];
    }
  },

  // ============================================================================
  // MESSAGE OPERATIONS
  // ============================================================================

  /**
   * Send a message (PRIMARY PERSISTENCE METHOD)
   * This is called when user sends a message
   */
  async sendMessage(
    conversationId: string,
    content: string,
    messageType: string = "text",
    attachments?: any[],
    replyToId?: string
  ): Promise<ChatMessage> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) throw new Error("Not authenticated");

      // INSERT message into database
      const { data: message, error } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.user.id,
          content,
          message_type: messageType,
          attachments: attachments || [],
          reply_to_id: replyToId,
          read_by: [user.user.id], // Mark as read by sender
        })
        .select()
        .single();

      if (error) throw error;

      // UPDATE conversation's last activity
      await supabase
        .from("chat_conversations")
        .update({
          last_message_id: message.id,
          last_activity: new Date().toISOString(),
        })
        .eq("id", conversationId);

      return {
        id: message.id,
        threadId: message.conversation_id,
        senderId: message.sender_id,
        content: message.content,
        timestamp: message.created_at,
        readBy: message.read_by || [user.user.id],
        messageType: message.message_type,
        attachments: message.attachments,
        replyTo: message.reply_to_id,
      };
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    limit = 50,
    offset = 0
  ): Promise<ChatMessage[]> {
    try {
      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Reverse to show chronological order
      return (messages || [])
        .reverse()
        .map((msg) => ({
          id: msg.id,
          threadId: msg.conversation_id,
          senderId: msg.sender_id,
          content: msg.content,
          timestamp: msg.created_at,
          readBy: msg.read_by || [],
          messageType: msg.message_type,
          attachments: msg.attachments,
          replyTo: msg.reply_to_id,
        }));
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  },

  /**
   * Mark message as read by user
   */
  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    try {
      // Get current read_by array
      const { data: message, error: fetchError } = await supabase
        .from("chat_messages")
        .select("read_by")
        .eq("id", messageId)
        .single();

      if (fetchError) throw fetchError;

      const readBy = message.read_by || [];
      if (!readBy.includes(userId)) {
        readBy.push(userId);

        // Update with new array
        await supabase
          .from("chat_messages")
          .update({ read_by: readBy })
          .eq("id", messageId);
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  },

  /**
   * Mark all messages in conversation as read
   */
  async markConversationAsRead(
    conversationId: string,
    userId: string
  ): Promise<void> {
    try {
      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select("id, read_by")
        .eq("conversation_id", conversationId)
        .eq("is_deleted", false);

      if (error) throw error;

      // Update each message
      for (const message of messages) {
        const readBy = message.read_by || [];
        if (!readBy.includes(userId)) {
          readBy.push(userId);
          await supabase
            .from("chat_messages")
            .update({ read_by: readBy })
            .eq("id", message.id);
        }
      }

      // Update participant's last_read_message_id
      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        await supabase
          .from("chat_participants")
          .update({
            last_read_message_id: lastMessage.id,
            last_read_at: new Date().toISOString(),
          })
          .eq("conversation_id", conversationId)
          .eq("user_id", userId);
      }
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  },

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("chat_messages")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  },

  /**
   * Edit a message
   */
  async editMessage(messageId: string, newContent: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("chat_messages")
        .update({
          content: newContent,
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      if (error) throw error;
    } catch (error) {
      console.error("Error editing message:", error);
      throw error;
    }
  },

  /**
   * Search messages in a conversation
   */
  async searchMessages(
    conversationId: string,
    query: string,
    limit = 20
  ): Promise<ChatMessage[]> {
    try {
      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .ilike("content", `%${query}%`)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (messages || []).map((msg) => ({
        id: msg.id,
        threadId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.content,
        timestamp: msg.created_at,
        readBy: msg.read_by || [],
        messageType: msg.message_type,
        attachments: msg.attachments,
        replyTo: msg.reply_to_id,
      }));
    } catch (error) {
      console.error("Error searching messages:", error);
      return [];
    }
  },

  // ============================================================================
  // FILE OPERATIONS
  // ============================================================================

  /**
   * Upload attachment and save metadata
   */
  async uploadAttachment(
    file: File,
    conversationId: string
  ): Promise<{ url: string; name: string; type: string; size: number }> {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `chat/${conversationId}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        name: file.name,
        type: file.type,
        size: file.size,
      };
    } catch (error) {
      console.error("Error uploading attachment:", error);
      throw error;
    }
  },

  // ============================================================================
  // TYPING INDICATORS
  // ============================================================================

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(conversationId: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) return;

      // Upsert typing indicator (replace if exists)
      await supabase.from("typing_indicators").upsert(
        {
          conversation_id: conversationId,
          user_id: user.user.id,
          started_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 10000).toISOString(),
        },
        { onConflict: "conversation_id,user_id" }
      );
    } catch (error) {
      console.error("Error sending typing indicator:", error);
    }
  },

  /**
   * Clear typing indicator
   */
  async clearTypingIndicator(conversationId: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) return;

      await supabase
        .from("typing_indicators")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("user_id", user.user.id);
    } catch (error) {
      console.error("Error clearing typing indicator:", error);
    }
  },

  /**
   * Get typing users in conversation
   */
  async getTypingUsers(conversationId: string): Promise<any[]> {
    try {
      const { data: typingIndicators, error } = await supabase
        .from("typing_indicators")
        .select("user_id, expires_at")
        .eq("conversation_id", conversationId)
        .gt("expires_at", new Date().toISOString());

      if (error) throw error;

      // Get user profiles
      const userIds = (typingIndicators || []).map((t) => t.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      return (typingIndicators || []).map((t) => ({
        id: t.user_id,
        name:
          profiles?.find((p) => p.user_id === t.user_id)?.full_name ||
          "User",
      }));
    } catch (error) {
      console.error("Error fetching typing users:", error);
      return [];
    }
  },

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to new messages in conversation
   */
  subscribeToMessages(
    conversationId: string,
    callback: (message: ChatMessage) => void
  ) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          const message = payload.new;
          callback({
            id: message.id,
            threadId: message.conversation_id,
            senderId: message.sender_id,
            content: message.content,
            timestamp: message.created_at,
            readBy: message.read_by || [],
            messageType: message.message_type,
            attachments: message.attachments,
            replyTo: message.reply_to_id,
          });
        }
      )
      .subscribe();
  },

  /**
   * Subscribe to read receipts
   */
  subscribeToReadReceipts(
    conversationId: string,
    callback: (messageId: string, readBy: string[]) => void
  ) {
    return supabase
      .channel(`read_receipts:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          const { id, read_by } = payload.new;
          callback(id, read_by || []);
        }
      )
      .subscribe();
  },

  /**
   * Subscribe to typing indicators
   */
  subscribeToTypingIndicators(
    conversationId: string,
    callback: (typingUsers: any[]) => void
  ) {
    return supabase
      .channel(`typing:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async () => {
          const typingUsers = await this.getTypingUsers(conversationId);
          callback(typingUsers);
        }
      )
      .subscribe();
  },
};

export default chatPersistenceService;
