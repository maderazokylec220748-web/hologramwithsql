import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IdleLogo } from "@/components/hologram/IdleLogo";
import { AvatarDisplay } from "@/components/hologram/AvatarDisplay";
import { ChatInterface } from "@/components/hologram/ChatInterface";
import { QuickActions } from "@/components/hologram/QuickActions";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Link } from "wouter";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isIdle, setIsIdle] = useState(true);
  const [idleTimeout, setIdleTimeout] = useState<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection for hologram sync
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    
    ws.onopen = () => {
      console.log('WebSocket connected for hologram sync');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  // Broadcast speaking state to hologram
  const broadcastToHologram = (speaking: boolean, text?: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'speaking',
        isSpeaking: speaking,
        text: text || ''
      }));
    }
  };

  // Reset to idle after 5 minutes of inactivity
  const resetIdleTimer = useCallback(() => {
    if (idleTimeout) clearTimeout(idleTimeout);
    setIsIdle(false);
    
    const timeout = setTimeout(() => {
      setIsIdle(true);
      setMessages([]);
    }, 300000);
    
    setIdleTimeout(timeout);
  }, [idleTimeout]);

  useEffect(() => {
    return () => {
      if (idleTimeout) clearTimeout(idleTimeout);
    };
  }, [idleTimeout]);

  const handleSendMessage = async (text: string) => {
    resetIdleTimer();
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Call the chat API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, userType: "visitor" }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.answer,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
      setIsSpeaking(true);
      
      // Broadcast to hologram that AI is speaking
      broadcastToHologram(true, data.answer);

      // Text-to-speech
      if (!isMuted && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(data.speechText || data.answer);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.onend = () => {
          setIsSpeaking(false);
          broadcastToHologram(false);
        };
        window.speechSynthesis.speak(utterance);
      } else {
        // If no speech, just show speaking animation for message length
        const duration = Math.min(data.answer.length * 50, 5000);
        setTimeout(() => {
          setIsSpeaking(false);
          broadcastToHologram(false);
        }, duration);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble connecting right now. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    
    // Stop any ongoing speech
    if (!isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      broadcastToHologram(false);
    }
  };

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleListening = () => {
    resetIdleTimer();
    
    if (!isListening) {
      // Start voice recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          handleSendMessage(transcript);
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } else {
        alert("Voice recognition is not supported in your browser. Please use Chrome or Edge.");
      }
    } else {
      setIsListening(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[hsl(0,60%,8%)] text-[hsl(45,30%,98%)] overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0,75%,10%)] via-[hsl(0,60%,8%)] to-[hsl(48,30%,10%)] opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(48,100%,50%,0.05),transparent_50%)]" />

      {/* Admin link */}
      <Link href="/admin">
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-6 right-6 z-50 text-[hsl(48,100%,50%)] hover:text-[hsl(48,100%,70%)] hover:bg-[hsl(48,100%,50%)]/10 transition-colors"
          data-testid="link-admin"
        >
          <Settings className="w-6 h-6" />
        </Button>
      </Link>

      {/* Hologram Display link */}
      <Button
        size="sm"
        variant="outline"
        className="absolute top-6 right-20 z-50 text-[hsl(48,100%,50%)] hover:text-[hsl(48,100%,70%)] hover:bg-[hsl(48,100%,50%)]/10 transition-colors border-[hsl(48,100%,50%)]/30"
        onClick={() => window.open('/hologram', '_blank', 'width=1200,height=800')}
      >
        Open Hologram Display
      </Button>

      <div className="container mx-auto h-full max-w-5xl px-2 sm:px-4 py-4 sm:py-8">
        <AnimatePresence mode="wait">
          {isIdle ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <IdleLogo onActivate={resetIdleTimer} />
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col"
            >
              {/* Header with Avatar */}
              <div className="flex-shrink-0 py-3 sm:py-6">
                <AvatarDisplay
                  isSpeaking={isSpeaking}
                  isMuted={isMuted}
                  onToggleMute={handleToggleMute}
                />
              </div>

              {/* Quick Actions or Chat */}
              <div className="flex-1 flex flex-col min-h-0 relative z-10">
                {messages.length === 0 ? (
                  <QuickActions onActionClick={handleSendMessage} />
                ) : (
                  <div className="flex-1 min-h-0">
                    <ChatInterface
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      isTyping={isTyping}
                      isListening={isListening}
                      onToggleListening={handleToggleListening}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hologram overlay effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0,60%,8%)] via-transparent to-transparent opacity-50" />
      </div>
    </div>
  );
}
