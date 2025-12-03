import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IdleLogo } from "@/components/hologram/IdleLogo";
import { AvatarDisplay } from "@/components/hologram/AvatarDisplay";
import { ChatInterface } from "@/components/hologram/ChatInterface";
import { QuickActions } from "@/components/hologram/QuickActions";
import { Button } from "@/components/ui/button";
import { Settings, MonitorPlay } from "lucide-react";
import { Link } from "wouter";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  queryId?: string;
  rating?: 'positive' | 'negative';
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
  const abortControllerRef = useRef<AbortController | null>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentRequestIdRef = useRef<string | null>(null);
  const isTypingRef = useRef<boolean>(false);

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

  // Sync isTyping to ref for use in callbacks
  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);

  const handleSendMessage = async (text: string) => {
    resetIdleTimer();
    
    // Generate unique ID for this request
    const requestId = Date.now().toString();
    currentRequestIdRef.current = requestId;
    
    console.log(`[${requestId}] Starting new request, aborting previous`);
    
    // Stop any ongoing operations from previous request
    if (abortControllerRef.current) {
      console.log(`[${requestId}] Aborting previous request`);
      abortControllerRef.current.abort();
    }
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    forceStopSpeech();
    setIsSpeaking(false);
    setIsTyping(false);
    broadcastToHologram(false);
    
    // Remove any incomplete AI messages from previous request
    // (messages that are still being typed out)
    setMessages((prev) => {
      // Keep only user messages and complete AI messages
      // Remove the last message if it's an AI message and we were typing
      if (prev.length > 0 && !prev[prev.length - 1].isUser && isTypingRef.current) {
        console.log(`[${requestId}] Removing incomplete AI message`);
        return prev.slice(0, -1);
      }
      return prev;
    });
    
    const userMessage: Message = {
      id: requestId,
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Call the chat API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, userType: "visitor" }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      
      // CRITICAL: Check if this is still the current request
      // If user sent new question, currentRequestIdRef will be new ID
      console.log(`[${requestId}] Got response, current request: ${currentRequestIdRef.current}`);
      if (currentRequestIdRef.current !== requestId) {
        console.log(`[${requestId}] DISCARDING - Response is from old request (current: ${currentRequestIdRef.current})`);
        setIsTyping(false);
        setIsSpeaking(false);
        return;
      }
      
      console.log(`[${requestId}] Processing response`);
      
      // CRITICAL: Check AGAIN before creating message
      if (currentRequestIdRef.current !== requestId) {
        console.log(`[${requestId}] DISCARDING - Newer request exists before message creation`);
        setIsTyping(false);
        setIsSpeaking(false);
        return;
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.answer,
        isUser: false,
        timestamp: new Date(),
        queryId: data.queryId,
      };
      
      // Check one more time before displaying
      if (currentRequestIdRef.current !== requestId) {
        console.log(`[${requestId}] DISCARDING - Newer request exists before display`);
        setIsTyping(false);
        setIsSpeaking(false);
        return;
      }
      
      console.log(`[${requestId}] Adding message to display`);
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
      setIsSpeaking(true);
      
      // Check before broadcasting
      if (currentRequestIdRef.current !== requestId) {
        console.log(`[${requestId}] DISCARDING - Newer request exists before broadcast - removing message`);
        setIsSpeaking(false);
        // Remove the message we just added
        setMessages((prev) => prev.filter(m => m.id !== aiMessage.id));
        return;
      }
      
      // Broadcast to hologram that AI is speaking
      broadcastToHologram(true, data.answer);

      // Text-to-speech
      if (!isMuted && 'speechSynthesis' in window && currentRequestIdRef.current === requestId) {
        const utterance = new SpeechSynthesisUtterance(data.speechText || data.answer);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.onend = () => {
          utteranceRef.current = null;
          setIsSpeaking(false);
          broadcastToHologram(false);
        };
        utterance.onerror = () => {
          utteranceRef.current = null;
          setIsSpeaking(false);
          broadcastToHologram(false);
        };
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } else {
        // If no speech, just show speaking animation for message length
        const duration = Math.min(data.answer.length * 50, 5000);
        speechTimeoutRef.current = setTimeout(() => {
          if (currentRequestIdRef.current === requestId) {
            setIsSpeaking(false);
            broadcastToHologram(false);
          }
          speechTimeoutRef.current = null;
        }, duration);
      }
    } catch (error: any) {
      // Don't show error if request was aborted (user sent new question)
      if (error.name === 'AbortError') {
        console.log(`[${requestId}] Request aborted (new request started)`);
        setIsTyping(false);
        return;
      }
      
      // Don't show error if this is not the current request
      if (currentRequestIdRef.current !== requestId) {
        console.log(`[${requestId}] Error in old request - ignoring`);
        return;
      }
      
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

  const forceStopSpeech = () => {
    if ('speechSynthesis' in window) {
      // Stop current utterance
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      
      // Aggressive stop: cancel multiple times and pause/resume to force immediate stop
      window.speechSynthesis.cancel();
      window.speechSynthesis.pause();
      window.speechSynthesis.cancel();
      
      // Some browsers need resume then cancel again
      setTimeout(() => {
        window.speechSynthesis.resume();
        window.speechSynthesis.cancel();
      }, 0);
      
      utteranceRef.current = null;
    }
  };

  const handleStop = () => {
    console.log(`Stopping current request: ${currentRequestIdRef.current}`);
    
    // Abort ongoing fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Clear speech timeout
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    
    // Force stop speech synthesis immediately
    forceStopSpeech();
    
    // Reset all states immediately - this will trigger shouldStop in TypewriterText
    setIsSpeaking(false);
    setIsTyping(false);
    broadcastToHologram(false);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    
    // Stop any ongoing speech
    if (!isMuted) {
      forceStopSpeech();
      setIsSpeaking(false);
      broadcastToHologram(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      forceStopSpeech();
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

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
      setIsIdle(true);
      // Stop any ongoing operations
      handleStop();
    }
  };

  const handleFeedback = async (messageId: string, rating: 'positive' | 'negative') => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message || !message.queryId) return;

      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: message.queryId,
          rating,
        }),
      });

      // Update message with rating
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, rating } : m
      ));
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  return (
    <div className="h-screen w-screen bg-[hsl(0,60%,8%)] text-[hsl(45,30%,98%)] overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0,75%,10%)] via-[hsl(0,60%,8%)] to-[hsl(48,30%,10%)] opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(48,100%,50%,0.05),transparent_50%)]" />

      {/* Top navigation buttons */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        {/* Hologram Display button */}
        <Button
          size="icon"
          variant="outline"
          className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(280,100%,50%)]/10 to-[hsl(48,100%,50%)]/10 border-[hsl(48,100%,50%)]/40 text-[hsl(48,100%,50%)] hover:text-[hsl(48,100%,70%)] hover:bg-[hsl(48,100%,50%)]/20 hover:border-[hsl(48,100%,50%)]/60 transition-all shadow-lg hover:shadow-[hsl(48,100%,50%)]/20 hover:scale-105"
          onClick={() => window.open('/hologram', '_blank', 'width=1200,height=800')}
          title="Open Hologram Display"
        >
          <MonitorPlay className="h-5 w-5" />
        </Button>

        {/* Admin Settings button - Obscure path for OWASP security compliance */}
        <Link href="/secure-f4c71bebae51ab7a">
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(48,100%,50%)]/10 to-[hsl(0,75%,50%)]/10 border-[hsl(48,100%,50%)]/40 text-[hsl(48,100%,50%)] hover:text-[hsl(48,100%,70%)] hover:bg-[hsl(48,100%,50%)]/20 hover:border-[hsl(48,100%,50%)]/60 transition-all shadow-lg hover:shadow-[hsl(48,100%,50%)]/20 hover:scale-105"
            data-testid="link-admin"
            title="Admin Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>

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
                      isSpeaking={isSpeaking}
                      onStop={handleStop}
                      onClearChat={handleClearChat}
                      onFeedback={handleFeedback}
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
