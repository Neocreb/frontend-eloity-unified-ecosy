// @ts-nocheck
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  Smile,
  Paperclip,
  Mic,
  X,
  Image as ImageIcon,
  File as FileIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileSelect?: (file: File) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const EnhancedChatInput: React.FC<EnhancedChatInputProps> = ({
  value,
  onChange,
  onSend,
  onFileSelect,
  isLoading = false,
  placeholder = "Type a message...",
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [emojiOpen, setEmojiOpen] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(
        textareaRef.current.scrollHeight,
        100
      ) + "px";
    }
  }, [value]);

  // Handle key press (Send on Enter, new line on Shift+Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSend();
      }
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Emoji picker (simple - can be enhanced)
  const emojis = ["😊", "😂", "🤔", "😍", "🎉", "🔥", "👍", "💯"];

  const handleEmojiSelect = (emoji: string) => {
    onChange(value + emoji);
    setEmojiOpen(false);
  };

  return (
    <div className="space-y-2">
      {/* File input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="text-sm font-medium text-red-600">
            Recording {recordingTime}s
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsRecording(false)}
            className="ml-auto text-red-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="flex gap-2 rounded-full border border-gray-300 bg-white px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        {/* Emoji picker button */}
        <DropdownMenu open={emojiOpen} onOpenChange={setEmojiOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              disabled={disabled}
            >
              <Smile className="h-5 w-5 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <div className="grid grid-cols-4 gap-2 p-2">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="text-2xl hover:bg-gray-100 p-2 rounded"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* File/Attachment menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              disabled={disabled}
            >
              <Paperclip className="h-5 w-5 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file && onFileSelect) {
                    onFileSelect(file);
                  }
                };
                input.click();
              }}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Image
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file && onFileSelect) {
                    onFileSelect(file);
                  }
                };
                input.click();
              }}
            >
              <FileIcon className="mr-2 h-4 w-4" />
              File
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Message input */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className="flex-1 resize-none border-0 bg-transparent px-2 py-1 focus:ring-0"
          rows={1}
        />

        {/* Send / Voice button */}
        {value.trim() ? (
          <Button
            onClick={onSend}
            disabled={isLoading || disabled}
            size="sm"
            className="h-8 w-8 rounded-full bg-blue-600 p-0 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={() => setIsRecording(!isRecording)}
            disabled={disabled}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title={isRecording ? "Stop recording" : "Start voice message"}
          >
            <Mic className={cn(
              "h-5 w-5",
              isRecording ? "text-red-600" : "text-gray-600"
            )} />
          </Button>
        )}
      </div>

      {/* Helper text */}
      <p className="px-3 text-xs text-gray-400">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
};

export default EnhancedChatInput;
