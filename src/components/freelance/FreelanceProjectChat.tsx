import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  FileText,
  Download,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFreelanceChat } from '@/hooks/use-freelance-chat';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface FreelanceProjectChatProps {
  projectId: string;
  projectTitle?: string;
  otherUserName?: string;
  otherUserAvatar?: string;
  className?: string;
}

export const FreelanceProjectChat: React.FC<FreelanceProjectChatProps> = ({
  projectId,
  projectTitle = 'Project Discussion',
  otherUserName = 'Team Member',
  otherUserAvatar = '/placeholder.svg',
  className = '',
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    hasMore,
    loadMore,
    unreadCount,
  } = useFreelanceChat(projectId);

  // Auto-scroll to bottom
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    const unreadMessages = messages
      .filter(msg => !msg.read && msg.senderId !== user?.id)
      .map(msg => msg.id);

    if (unreadMessages.length > 0) {
      markAsRead(unreadMessages);
    }
  }, [messages, user?.id, markAsRead]);

  // Handle scroll to show/hide button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && messages.length > 0);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || sending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);

    try {
      await sendMessage(content, 'text');
      toast({
        title: 'Message sent',
        description: 'Your message has been delivered.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (error && !messages.length) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8 text-destructive">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {/* Header */}
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUserAvatar} alt={otherUserName} />
              <AvatarFallback>{otherUserName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{projectTitle}</CardTitle>
              <p className="text-xs text-muted-foreground">{otherUserName}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Project Details</DropdownMenuItem>
              <DropdownMenuItem>Clear Chat</DropdownMenuItem>
              <DropdownMenuItem>Report Issue</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex flex-col h-[500px] p-0">
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {loading && messages.length === 0 ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <>
              {hasMore && (
                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    Load Earlier Messages
                  </Button>
                </div>
              )}

              {messages.map((message, index) => {
                const isCurrentUser = message.senderId === user?.id;
                const showAvatar =
                  index === 0 ||
                  messages[index - 1]?.senderId !== message.senderId;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                  >
                    {showAvatar && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage
                          src={message.sender.avatar}
                          alt={message.sender.name}
                        />
                        <AvatarFallback>
                          {message.sender.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {!showAvatar && <div className="h-8 w-8 flex-shrink-0" />}

                    <div className={`flex flex-col ${isCurrentUser ? 'items-end' : ''}`}>
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          isCurrentUser
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-muted rounded-bl-none'
                        }`}
                      >
                        {message.messageType === 'file' ? (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{message.content}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 ml-2"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm break-words">{message.content}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(message.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {showScrollButton && (
                <Button
                  size="sm"
                  className="mx-auto mt-4"
                  onClick={() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <ChevronDown className="h-4 w-4 mr-1" />
                  New Messages
                </Button>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t p-4 space-y-3">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending || loading}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              disabled={sending || loading}
              className="text-muted-foreground"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={sending || loading}
              className="text-muted-foreground"
            >
              <Smile className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sending || loading}
              size="sm"
            >
              {sending ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
