import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, StopCircle, Trash2, ThumbsUp, ThumbsDown, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TypewriterText } from "@/components/chat/TypewriterText";
import { TypingIndicator } from "@/components/chat/LoadingStates";

// Function to parse markdown-style formatting
const parseMarkdown = (text: string) => {
  const parts: { text: string; bold: boolean }[] = [];
  const regex = /(\*\*.*?\*\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    // Add the bold text (remove the **)
    parts.push({ text: match[0].slice(2, -2), bold: true });
    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), bold: false });
  }

  return parts.length > 0 ? parts : [{ text, bold: false }];
};

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  queryId?: string;
  rating?: 'positive' | 'negative';
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isTyping: boolean;
  isListening: boolean;
  onToggleListening: () => void;
  isSpeaking: boolean;
  onStop: () => void;
  onClearChat: () => void;
  onFeedback: (messageId: string, rating: 'positive' | 'negative') => void;
  onGoHome?: () => void;
}

export function ChatInterface({
  messages,
  onSendMessage,
  isTyping,
  isListening,
  onToggleListening,
  isSpeaking,
  onStop,
  onClearChat,
  onFeedback,
  onGoHome,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [ratedMessages, setRatedMessages] = useState<Set<string>>(new Set());
  const [completedTyping, setCompletedTyping] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "flex",
                message.isUser ? "justify-end" : "justify-start"
              )}
            >
              <div className="flex flex-col gap-2">
                <div
                  className={cn(
                    "p-4 sm:p-6 rounded-2xl shadow-2xl border-2",
                    message.isUser
                      ? "bg-[hsl(0,75%,25%)] text-[hsl(45,30%,98%)]"
                      : "border-2 border-[hsl(48,100%,50%)] bg-transparent backdrop-blur-sm text-[hsl(45,30%,98%)]"
                  )}
                >
                  <motion.p 
                    key={message.id}
                    className={cn(
                      "text-sm sm:text-lg font-medium leading-relaxed tracking-wide",
                      message.isUser ? "" : "whitespace-pre-wrap"
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {parseMarkdown(message.text).map((part, index) => 
                      part.bold ? (
                        <strong key={index}>{part.text}</strong>
                      ) : (
                        <span key={index}>{part.text}</span>
                      )
                    )}
                  </motion.p>
                  <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                
                {/* Feedback buttons for AI messages - only show when not typing or speaking */}
                {!message.isUser && !ratedMessages.has(message.id) && !isTyping && !isSpeaking && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 ml-2 items-center"
                  >
                    <span className="text-xs text-[hsl(48,100%,50%)] mr-1">Was this helpful?</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 border border-[hsl(48,100%,50%)] text-[hsl(48,100%,50%)] hover:bg-[hsl(48,100%,50%)] hover:text-[hsl(0,75%,25%)]"
                      onClick={() => {
                        onFeedback(message.id, 'positive');
                        setRatedMessages(prev => new Set(prev).add(message.id));
                      }}
                      title="Helpful"
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      <span className="text-xs">Yes</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 border border-red-400 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500"
                      onClick={() => {
                        onFeedback(message.id, 'negative');
                        setRatedMessages(prev => new Set(prev).add(message.id));
                      }}
                      title="Not helpful"
                    >
                      <ThumbsDown className="w-4 h-4 mr-1" />
                      <span className="text-xs">No</span>
                    </Button>
                  </motion.div>
                )}
                
                {/* Show feedback confirmation */}
                {!message.isUser && ratedMessages.has(message.id) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2 ml-2 items-center text-xs text-[hsl(48,100%,50%)] opacity-70"
                  >
                    <span>Thanks for your feedback!</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="border-2 border-[hsl(48,100%,50%)] bg-transparent backdrop-blur-sm rounded-2xl px-4 py-3">
              <TypingIndicator />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-[hsl(48,100%,50%)] bg-[hsl(0,60%,8%)] p-2 sm:p-4">
        <div className="flex gap-2 mb-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onGoHome}
            className="text-xs hover:bg-[hsl(48,100%,50%)] hover:text-[hsl(0,75%,25%)] hover:border-[hsl(48,100%,50%)]"
          >
            <Home className="w-3 h-3 mr-1" />
            Home
          </Button>
          {messages.length > 0 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onClearChat}
              className="text-xs hover:bg-red-500 hover:text-white hover:border-red-500"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear Chat
            </Button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-1.5 sm:gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about admissions, programs, campus..."
            className="flex-1 bg-[hsl(0,70%,20%)] border-[hsl(48,100%,50%)] text-[hsl(45,30%,98%)] placeholder:text-[hsl(45,20%,65%)] text-xs sm:text-base focus-visible:ring-[hsl(48,100%,50%)] overflow-x-auto whitespace-nowrap"
            data-testid="input-chat-message"
          />
          
          <Button
            type="button"
            size="icon"
            variant={isListening ? "default" : "outline"}
            onClick={onToggleListening}
            className={cn(
              "transition-colors h-9 w-9 sm:h-10 sm:w-10",
              isListening && "bg-[hsl(48,100%,50%)] text-[hsl(0,75%,25%)] animate-pulse"
            )}
            data-testid="button-voice-input"
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
          </Button>

          {isSpeaking || isTyping ? (
            <Button
              type="button"
              size="icon"
              onClick={onStop}
              className="bg-red-500 text-white hover:bg-red-600 h-9 w-9 sm:h-10 sm:w-10 animate-pulse"
              data-testid="button-stop-speech"
              title="Stop speaking"
            >
              <StopCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="bg-[hsl(48,100%,50%)] text-[hsl(0,75%,25%)] hover:bg-[hsl(48,100%,60%)] h-9 w-9 sm:h-10 sm:w-10"
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
