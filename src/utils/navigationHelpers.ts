import { NavigateFunction } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { UserService } from "@/services/userService";

/**
 * Navigate to a direct chat with a user by their username
 * Creates the conversation if it doesn't exist and navigates to the specific thread
 */
export const navigateToDirectChat = async (
  username: string,
  navigate: NavigateFunction,
  currentUserId: string | undefined
) => {
  if (!currentUserId || !username) {
    console.error("Missing currentUserId or username");
    return;
  }

  try {
    // Search for the user by username
    const users = await UserService.searchUsers(username, 1);
    
    if (!users || users.length === 0) {
      console.error("User not found:", username);
      return;
    }

    const targetUserId = users[0].id;

    // Check if a conversation already exists
    const { data: existingConversations } = await supabase
      .from("chat_conversations")
      .select("id")
      .contains("participants", [currentUserId, targetUserId])
      .maybeSingle();

    let conversationId: string;

    if (existingConversations) {
      // Use existing conversation
      conversationId = existingConversations.id;
    } else {
      // Create a new conversation
      const { data: newConversation, error } = await supabase
        .from("chat_conversations")
        .insert({
          participants: [currentUserId, targetUserId],
        })
        .select("id")
        .single();

      if (error) {
        console.error("Error creating conversation:", error);
        return;
      }

      conversationId = newConversation.id;
    }

    // Navigate to the specific chat thread
    navigate(`/app/chat/${conversationId}?type=social`);
  } catch (error) {
    console.error("Error navigating to chat:", error);
  }
};

/**
 * Navigate to the send money page with a pre-filled recipient
 */
export const navigateToSendMoney = (
  username: string,
  navigate: NavigateFunction
) => {
  if (!username) {
    console.error("Missing username");
    return;
  }

  // Navigate to send money page with recipient as query parameter
  navigate(`/app/wallet/send-money?recipient=${encodeURIComponent(username)}`);
};
