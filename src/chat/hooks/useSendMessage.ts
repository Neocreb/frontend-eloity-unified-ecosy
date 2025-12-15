import { useState, useCallback } from "react";
import { ChatMessage } from "@/types/chat";
import { chatPersistenceService } from "@/services/chatPersistenceService";
import { useToast } from "@/hooks/use-toast";

export const useSendMessage = (threadId: string) => {
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const sendTextMessage = useCallback(
    async (content: string, replyTo?: string): Promise<ChatMessage | null> => {
      if (!content.trim()) return null;

      try {
        setSending(true);

        const message = await chatPersistenceService.sendMessage(
          threadId,
          content.trim(),
          {
            messageType: "text",
            replyToId: replyTo,
          }
        );

        if (!message) {
          throw new Error("Failed to send message");
        }

        return message;
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
        console.error("Error sending message:", error);
        return null;
      } finally {
        setSending(false);
      }
    },
    [threadId, toast]
  );

  const sendImageMessage = useCallback(
    async (file: File, caption?: string): Promise<ChatMessage | null> => {
      try {
        setUploading(true);

        // Upload the image first
        const imageUrl = await chatPersistenceService.uploadFile(file);

        // Send message with image
        const message = await chatPersistenceService.sendMessage(
          threadId,
          caption || `📷 ${file.name}`,
          {
            attachments: [imageUrl],
            messageType: "image",
          }
        );

        if (!message) {
          throw new Error("Failed to send image message");
        }

        toast({
          title: "Image sent",
          description: "Your image has been shared",
        });

        return message;
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to send image",
          variant: "destructive",
        });
        console.error("Error sending image:", error);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [threadId, toast]
  );

  const sendFileMessage = useCallback(
    async (file: File, description?: string): Promise<ChatMessage | null> => {
      try {
        setUploading(true);

        // Upload the file first
        const fileUrl = await chatPersistenceService.uploadFile(file);

        // Send message with file
        const message = await chatPersistenceService.sendMessage(
          threadId,
          description || `📎 ${file.name}`,
          {
            attachments: [fileUrl],
            messageType: "file",
          }
        );

        if (!message) {
          throw new Error("Failed to send file message");
        }

        toast({
          title: "File sent",
          description: `${file.name} has been shared`,
        });

        return message;
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to send file",
          variant: "destructive",
        });
        console.error("Error sending file:", error);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [threadId, toast]
  );

  const sendMultipleFiles = useCallback(
    async (files: File[]): Promise<ChatMessage[]> => {
      const messages: ChatMessage[] = [];

      for (const file of files) {
        let message: ChatMessage | null = null;

        if (file.type.startsWith("image/")) {
          message = await sendImageMessage(file);
        } else {
          message = await sendFileMessage(file);
        }

        if (message) {
          messages.push(message);
        }
      }

      return messages;
    },
    [sendImageMessage, sendFileMessage]
  );

  const sendVoiceMessage = useCallback(
    async (audioBlob: Blob, duration: number): Promise<ChatMessage | null> => {
      try {
        setUploading(true);

        // Convert blob to file
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, {
          type: "audio/webm",
        });

        // Upload the audio file
        const audioUrl = await chatPersistenceService.uploadFile(audioFile);

        // Send message with voice note
        const message = await chatPersistenceService.sendMessage(
          threadId,
          `🎤 Voice message (${Math.round(duration)}s)`,
          {
            attachments: [audioUrl],
            messageType: "voice",
          }
        );

        if (!message) {
          throw new Error("Failed to send voice message");
        }

        toast({
          title: "Voice message sent",
          description: "Your voice message has been shared",
        });

        return message;
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to send voice message",
          variant: "destructive",
        });
        console.error("Error sending voice message:", error);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [threadId, toast]
  );

  const sendSystemMessage = useCallback(
    async (content: string): Promise<ChatMessage | null> => {
      try {
        const message = await chatPersistenceService.sendMessage(
          threadId,
          `[SYSTEM] ${content}`,
          {
            messageType: "text",
          }
        );

        return message;
      } catch (error) {
        console.error("Error sending system message:", error);
        return null;
      }
    },
    [threadId]
  );

  const sendReplyMessage = useCallback(
    async (
      content: string,
      replyToMessageId: string,
      replyToContent: string
    ): Promise<ChatMessage | null> => {
      const replyText = `Replying to: "${replyToContent.substring(0, 50)}${
        replyToContent.length > 50 ? "..." : ""
      }"\n\n${content}`;

      return sendTextMessage(replyText, replyToMessageId);
    },
    [sendTextMessage]
  );

  const sendQuickReaction = useCallback(
    async (messageId: string, emoji: string): Promise<void> => {
      try {
        await chatPersistenceService.addReaction(messageId, emoji);
      } catch (error) {
        console.error("Error sending reaction:", error);
        toast({
          title: "Error",
          description: "Failed to add reaction",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // Validate file before sending
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "audio/webm",
        "audio/mp3",
        "audio/wav",
      ];

      if (file.size > maxSize) {
        return { valid: false, error: "File size must be less than 50MB" };
      }

      if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: "File type not supported" };
      }

      return { valid: true };
    },
    []
  );

  const sendFiles = useCallback(
    async (files: FileList | File[]): Promise<void> => {
      const fileArray = Array.from(files);

      // Validate all files first
      for (const file of fileArray) {
        const validation = validateFile(file);
        if (!validation.valid) {
          toast({
            title: "Invalid file",
            description: `${file.name}: ${validation.error}`,
            variant: "destructive",
          });
          return;
        }
      }

      // Send all valid files
      await sendMultipleFiles(fileArray);
    },
    [validateFile, sendMultipleFiles, toast]
  );

  return {
    sending,
    uploading,
    sendTextMessage,
    sendImageMessage,
    sendFileMessage,
    sendMultipleFiles,
    sendVoiceMessage,
    sendSystemMessage,
    sendReplyMessage,
    sendQuickReaction,
    sendFiles,
    validateFile,
    isProcessing: sending || uploading,
  };
};
