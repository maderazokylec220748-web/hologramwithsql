import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function TypewriterText({ text, key: messageKey }: { text: string; key: string }) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    setDisplayedText("");
    setCurrentIndex(0);
    
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [messageKey, text]);

  useEffect(() => {
    if (!isMountedRef.current || currentIndex >= text.length) return;
    
    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }
    }, 30); // Adjust speed here (lower = faster)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [currentIndex, text]);

  // Split text by newlines and render each line
  const lines = displayedText.split('\n');
  
  return (
    <>
      {lines.map((line, index) => (
        <span key={index}>
          {line}
          {index < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isTyping: boolean;
  isListening: boolean;
  onToggleListening: () => void;
  isSpeaking: boolean;
  onStop: () => void;
}

export function ChatInterface({
  messages,
  onSendMessage,
  isTyping,
  isListening,
  onToggleListening,
  isSpeaking,
  onStop,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
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
              <div
                className={cn(
                  "max-w-[90%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3",
                  message.isUser
                    ? "bg-[hsl(0,75%,25%)] text-[hsl(45,30%,98%)]"
                    : "border-2 border-[hsl(48,100%,50%)] bg-transparent backdrop-blur-sm text-[hsl(45,30%,98%)]"
                )}
              >
                <motion.p 
                  className="text-sm sm:text-lg font-medium leading-relaxed tracking-wide overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {!message.isUser ? (
                    <TypewriterText text={message.text} key={message.id} />
                  ) : (
                    message.text
                  )}
                </motion.p>
                <p className="text-xs opacity-60 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
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
              <div className="flex gap-1">
                <motion.div
                  className="w-2 h-2 rounded-full bg-[hsl(48,100%,50%)]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
                <motion.div
                  className="w-2 h-2 rounded-full bg-[hsl(48,100%,50%)]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 rounded-full bg-[hsl(48,100%,50%)]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-[hsl(48,100%,50%)] bg-[hsl(0,60%,8%)] p-2 sm:p-4">
        <form onSubmit={handleSubmit} className="flex gap-1.5 sm:gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about admissions, programs, campus..."
            className="flex-1 bg-[hsl(0,70%,20%)] border-[hsl(48,100%,50%)] text-[hsl(45,30%,98%)] placeholder:text-[hsl(45,20%,65%)] text-sm sm:text-lg focus-visible:ring-[hsl(48,100%,50%)]"
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
