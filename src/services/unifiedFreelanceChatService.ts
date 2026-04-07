import { supabase } from '@/lib/supabase/client';
import { ChatThread, ChatMessage, SendMessageRequest } from '@/types/chat';

/**
 * UnifiedFreelanceChatService
 * Bridges the freelance project messaging system with the unified chat infrastructure
 * Allows freelancers and clients to communicate in projects through the main chat interface
 */

export class UnifiedFreelanceChatService {
  /**
   * Get or create a freelance project chat thread
   * Links freelance_projects to chat_conversations
   */
  static async getOrCreateProjectChatThread(
    projectId: string,
    clientId: string,
    freelancerId: string,
    projectTitle: string
  ): Promise<ChatThread | null> {
    try {
      // Check if chat thread already exists for this project
      const { data: existingThread } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('metadata->reference_type', 'freelance_project')
        .eq('metadata->project_id', projectId)
        .single();

      if (existingThread) {
        return this.mapConversationToThread(existingThread);
      }

      // Create new chat conversation for the project
      const conversationId = crypto.randomUUID();
      const { data: newConversation, error } = await supabase
        .from('chat_conversations')
        .insert({
          id: conversationId,
          type: 'direct',
          name: `Project: ${projectTitle}`,
          participants: [clientId, freelancerId],
          created_by: clientId,
          metadata: {
            reference_type: 'freelance_project',
            project_id: projectId,
            client_id: clientId,
            freelancer_id: freelancerId,
          },
          settings: {
            project_notifications: true,
            milestone_updates: true,
            payment_notifications: true,
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating project chat thread:', error);
        return null;
      }

      return this.mapConversationToThread(newConversation);
    } catch (error) {
      console.error('Error in getOrCreateProjectChatThread:', error);
      return null;
    }
  }

  /**
   * Get all chat threads for a freelance project
   */
  static async getProjectChatThreads(projectId: string): Promise<ChatThread[]> {
    try {
      const { data: conversations } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('metadata->reference_type', 'freelance_project')
        .eq('metadata->project_id', projectId);

      if (!conversations) return [];
      return conversations.map(conv => this.mapConversationToThread(conv));
    } catch (error) {
      console.error('Error getting project chat threads:', error);
      return [];
    }
  }

  /**
   * Send a message in a freelance project chat
   */
  static async sendProjectMessage(
    threadId: string,
    userId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' | 'milestone' | 'payment' = 'text',
    attachments?: string[],
    metadata?: any
  ): Promise<ChatMessage | null> {
    try {
      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: threadId,
          sender_id: userId,
          content,
          message_type: messageType,
          attachments,
          metadata: {
            ...metadata,
            freelance_message: true,
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending project message:', error);
        return null;
      }

      // Update conversation's last_activity and last_message_id
      await supabase
        .from('chat_conversations')
        .update({
          last_message_id: message.id,
          last_activity: new Date().toISOString(),
        })
        .eq('id', threadId);

      return message as ChatMessage;
    } catch (error) {
      console.error('Error in sendProjectMessage:', error);
      return null;
    }
  }

  /**
   * Get messages for a freelance project chat
   */
  static async getProjectMessages(
    threadId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatMessage[]> {
    try {
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', threadId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!messages) return [];
      return messages.reverse() as ChatMessage[];
    } catch (error) {
      console.error('Error getting project messages:', error);
      return [];
    }
  }

  /**
   * Mark messages as read in a freelance project chat
   */
  static async markProjectMessagesAsRead(
    threadId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Get the latest message in the conversation
      const { data: latestMessage } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('conversation_id', threadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!latestMessage) return false;

      // Update or create chat participant record
      const { error } = await supabase
        .from('chat_participants')
        .upsert({
          conversation_id: threadId,
          user_id: userId,
          last_read_message_id: latestMessage.id,
          last_read_at: new Date().toISOString(),
        }, {
          onConflict: 'conversation_id,user_id',
        });

      if (error) {
        console.error('Error marking messages as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markProjectMessagesAsRead:', error);
      return false;
    }
  }

  /**
   * Get unread message count for a freelance project
   */
  static async getUnreadMessageCount(threadId: string, userId: string): Promise<number> {
    try {
      // Get the user's last read message
      const { data: participant } = await supabase
        .from('chat_participants')
        .select('last_read_message_id')
        .eq('conversation_id', threadId)
        .eq('user_id', userId)
        .single();

      if (!participant?.last_read_message_id) {
        // If no read status, count all messages
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', threadId);
        return count || 0;
      }

      // Count messages after the last read message
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', threadId)
        .gt('created_at', 
          `(SELECT created_at FROM chat_messages WHERE id = '${participant.last_read_message_id}')`
        );

      return count || 0;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }
  }

  /**
   * Subscribe to real-time updates for a freelance project chat
   */
  static subscribeToProjectChat(
    threadId: string,
    callback: (message: ChatMessage) => void
  ): (() => void) | null {
    try {
      const subscription = supabase
        .from(`chat_messages:conversation_id=eq.${threadId}`)
        .on('INSERT', (payload: any) => {
          callback(payload.new as ChatMessage);
        })
        .subscribe();

      return () => {
        supabase.removeSubscription(subscription);
      };
    } catch (error) {
      console.error('Error subscribing to project chat:', error);
      return null;
    }
  }

  /**
   * Get or create a project chat for sending notifications
   * This creates a system message in the project chat
   */
  static async sendProjectNotification(
    projectId: string,
    clientId: string,
    freelancerId: string,
    projectTitle: string,
    notificationType: 'milestone' | 'payment' | 'deadline' | 'dispute' | 'system',
    title: string,
    description: string,
    metadata?: any
  ): Promise<ChatMessage | null> {
    try {
      // Get or create the project chat thread
      const thread = await this.getOrCreateProjectChatThread(
        projectId,
        clientId,
        freelancerId,
        projectTitle
      );

      if (!thread) return null;

      // Send a system message to the project chat
      return await this.sendProjectMessage(
        thread.id,
        clientId, // System messages from project owner
        `[${notificationType.toUpperCase()}] ${title}\n${description}`,
        notificationType as any,
        undefined,
        {
          notification_type: notificationType,
          is_system_notification: true,
          ...metadata,
        }
      );
    } catch (error) {
      console.error('Error sending project notification:', error);
      return null;
    }
  }

  /**
   * Helper: Map chat_conversations row to ChatThread type
   */
  private static mapConversationToThread(conversation: any): ChatThread {
    return {
      id: conversation.id,
      type: 'freelance',
      referenceId: conversation.metadata?.project_id || null,
      participants: conversation.participants || [],
      lastMessage: conversation.last_message || '',
      lastMessageAt: conversation.last_activity || new Date().toISOString(),
      updatedAt: conversation.updated_at || new Date().toISOString(),
      isGroup: false,
      groupName: conversation.name,
      groupDescription: conversation.description,
      createdBy: conversation.created_by,
      createdAt: conversation.created_at,
      contextData: {
        jobTitle: conversation.name,
      },
      isPinned: false,
      isArchived: conversation.is_archived || false,
      isMuted: conversation.is_muted || false,
    };
  }

  /**
   * Helper: Map chat_messages row to ChatMessage type
   */
  private static mapMessageToChatMessage(message: any, senderName?: string): ChatMessage {
    return {
      id: message.id,
      threadId: message.conversation_id,
      senderId: message.sender_id,
      senderName: senderName,
      content: message.content,
      attachments: message.attachments,
      timestamp: message.created_at,
      readBy: message.read_by || [],
      messageType: message.message_type,
      metadata: message.metadata,
    };
  }
}

export default UnifiedFreelanceChatService;
