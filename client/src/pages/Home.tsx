import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IdleLogo } from "@/components/hologram/IdleLogo";
import { AvatarDisplay } from "@/components/hologram/AvatarDisplay";
import { ChatInterface } from "@/components/hologram/ChatInterface";
import { QuickActions } from "@/components/hologram/QuickActions";
import { Button } from "@/components/ui/button";
import { MonitorPlay, Settings, Volume2 } from "lucide-react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  queryId?: string;
  rating?: 'positive' | 'negative';
}

export default function Home() {
  // Load messages from localStorage on mount with expiration check
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('chatMessages');
      const sessionStart = localStorage.getItem('chatSessionStart');
      
      if (saved && sessionStart) {
        const sessionAge = Date.now() - parseInt(sessionStart);
        const ONE_HOUR = 60 * 60 * 1000;
        
        // Clear messages older than 1 hour for privacy
        if (sessionAge > ONE_HOUR) {
          console.log('🔒 Chat session expired (>1 hour), clearing for privacy');
          localStorage.removeItem('chatMessages');
          localStorage.removeItem('chatSessionStart');
          return [];
        }
        
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading messages from localStorage:', error);
      localStorage.removeItem('chatMessages');
      localStorage.removeItem('chatSessionStart');
    }
    return [];
  });
  
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState<'en' | 'tl'>(() => {
    try {
      const saved = localStorage.getItem('language');
      return (saved === 'tl' ? 'tl' : 'en');
    } catch {
      return 'en';
    }
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('aiVolume');
    return saved ? parseInt(saved) : 80;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isIdle, setIsIdle] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [idleTimeout, setIdleTimeout] = useState<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestIdRef = useRef<string | null>(null);
  const isTypingRef = useRef<boolean>(false);

  // Save messages to localStorage whenever they change (with 1-hour retention)
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem('chatMessages', JSON.stringify(messages));
        // Track session start for expiration
        if (!localStorage.getItem('chatSessionStart')) {
          localStorage.setItem('chatSessionStart', Date.now().toString());
        }
        console.log(`💾 Saved ${messages.length} messages (1-hour retention for privacy)`);
      } else {
        localStorage.removeItem('chatMessages');
        localStorage.removeItem('chatSessionStart');
      }
    } catch (error) {
      console.error('Error saving messages to localStorage:', error);
    }
  }, [messages]);

  // Save volume to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('aiVolume', volume.toString());
  }, [volume]);

  // WebSocket connection for hologram sync
  useEffect(() => {
    // Prevent duplicate connections
    if (wsRef.current) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    
    ws.onopen = () => {
      console.log('WebSocket connected for hologram sync');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Handle control messages from hologram (e.g., pause)
        if (data.type === 'control' && data.action === 'pause') {
          console.log('Pause command received from hologram');
          handleStop();
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Home WebSocket closed');
      wsRef.current = null;
    };

    wsRef.current = ws;

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
        wsRef.current = null;
      }
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

  // Reset to idle after 10 minutes of inactivity (privacy protection)
  const resetIdleTimer = useCallback(() => {
    if (idleTimeout) clearTimeout(idleTimeout);
    setIsIdle(false);
    
    const timeout = setTimeout(() => {
      setIsIdle(true);
      setMessages([]);
      localStorage.removeItem('chatMessages');
      localStorage.removeItem('chatSessionStart');
      console.log('🔒 Chat cleared due to inactivity (privacy protection)');
    }, 600000); // 10 minutes
    
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
    setShowQuickActions(false); // Hide quick actions when sending a message
    
    // Generate unique ID for this request
    const requestId = Date.now().toString();
    currentRequestIdRef.current = requestId;
    
    console.log(`[${requestId}] Starting new request, aborting previous`);
    
    // Stop any ongoing operations from previous request
    if (abortControllerRef.current) {
      console.log(`[${requestId}] Aborting previous request`);
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    forceStopSpeech();
    setIsSpeaking(false);
    broadcastToHologram(false);
    
    // Only remove incomplete AI messages (still typing)
    // Keep completed messages to preserve conversation history
    if (isTyping || isSpeaking) {
      setMessages((prev) => {
        // Remove the last message if it's an AI message AND we're still processing
        if (prev.length > 0 && !prev[prev.length - 1].isUser) {
          console.log(`[${requestId}] Removing incomplete AI message from previous request`);
          return prev.slice(0, -1);
        }
        return prev;
      });
    }
    
    // Reset typing state AFTER cleaning up messages
    setIsTyping(false);
    
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
      console.log(`[${requestId}] Sending request to /api/chat-stream`);
      
      // Build conversation history (last 6 messages for context)
      const conversationHistory = messages.slice(-6).map(msg => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.text
      }));
      
      // Call the STREAMING chat API with conversation history
      const response = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: text, 
          userType: "visitor",
          language,
          conversationHistory 
        }),
        signal: abortControllerRef.current.signal,
      });

      console.log(`[${requestId}] Stream opened, status: ${response.status}`);

      if (!response.ok) {
        console.error(`[${requestId}] Response not OK: ${response.status}`);
        throw new Error("Failed to get response");
      }

      // Create AI message that will be updated with streaming tokens
      const aiMessage: Message = {
        id: `ai-${requestId}`,
        text: "", // Will be filled in as tokens arrive
        isUser: false,
        timestamp: new Date(),
        queryId: undefined,
        rating: undefined,
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(true); // Show typing indicator while streaming
      setIsSpeaking(true);
      
      // Broadcast to hologram that AI is speaking (will receive complete answer at end)
      broadcastToHologram(true, "");

      // Read streaming events
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = '';
      let completeAnswer = '';
      let metadata: any = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Process all complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (!line || !line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6)); // Remove "data: " prefix
            
            if (data.error) {
              console.error(`[${requestId}] Stream error:`, data.error);
              break;
            }

            if (data.done) {
              // Final event with metadata
              metadata = data;
              completeAnswer = data.complete || completeAnswer;
              console.log(`[${requestId}] Stream complete, length: ${completeAnswer.length}`);
            } else if (data.token) {
              // Token received - update message in real-time
              completeAnswer += data.token;
              
              setMessages((prev) => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg?.id === aiMessage.id) {
                  lastMsg.text = completeAnswer;
                }
                return updated;
              });
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }

        // Keep the last incomplete line in the buffer
        buffer = lines[lines.length - 1];
      }

      // Update message with final metadata and complete answer
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg?.id === aiMessage.id) {
          lastMsg.text = completeAnswer; // Ensure text is set (important for direct answers)
          lastMsg.queryId = metadata.queryId;
          lastMsg.rating = metadata.rating;
        }
        return updated;
      });

      console.log(`[${requestId}] Stream processing complete`);
      setIsTyping(false);
      
      // Broadcast complete answer to hologram with speech
      broadcastToHologram(true, completeAnswer);

      // Show speaking animation based on text length
      const duration = Math.min((completeAnswer?.length || 100) * 50, 5000);
      speechTimeoutRef.current = setTimeout(() => {
        setIsSpeaking(false);
        broadcastToHologram(false);
        speechTimeoutRef.current = null;
      }, duration);
    } catch (error: any) {
      // Don't show error if request was aborted (user sent new question)
      if (error.name === 'AbortError') {
        console.log(`[${requestId}] Request aborted (new request started)`);
        setIsTyping(false);
        return;
      }
      
      console.error(`[${requestId}] Chat error:`, error);
      const errorMessage: Message = {
        id: `error-${requestId}`,
        text: "I apologize, but I'm having trouble connecting right now. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  const forceStopSpeech = () => {
    // Audio plays on hologram page, just clear speaking state
    setIsSpeaking(false);
    broadcastToHologram(false);
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
    
    // Stop any ongoing speech (hologram will handle muting audio)
    if (!isMuted) {
      forceStopSpeech();
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
        recognition.lang = language === 'tl' ? 'fil-PH' : 'en-US';

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
      localStorage.removeItem('chatMessages');
      console.log('🗑️ Chat history cleared from localStorage');
      setIsIdle(true);
      // Stop any ongoing operations
      handleStop();
    }
  };

  const handleGoHome = () => {
    setIsIdle(true);
    setShowQuickActions(true);
    handleStop();
  };

  const handleFeedback = async (messageId: string, rating: 'positive' | 'negative') => {
    try {
      const message = messages.find(m => m.id === messageId);
      console.log('Feedback clicked:', { messageId, rating, message });
      
      if (!message) {
        console.error('Message not found:', messageId);
        return;
      }
      
      if (!message.queryId) {
        console.error('No queryId for message:', messageId);
        return;
      }

      console.log('Sending feedback to server:', { queryId: message.queryId, rating });
      
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: message.queryId,
          rating,
        }),
      });

      if (!response.ok) {
        console.error('Feedback response not OK:', response.status);
        throw new Error('Failed to submit feedback');
      }

      const result = await response.json();
      console.log('Feedback submitted successfully:', result);

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
          onClick={() => window.open('/hologram-new', '_blank', 'width=1200,height=800')}
          title="Open Hologram Display"
        >
          <MonitorPlay className="h-5 w-5" />
        </Button>

        {/* Settings button */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(48,100%,50%)]/10 to-[hsl(0,75%,50%)]/10 border-[hsl(48,100%,50%)]/40 text-[hsl(48,100%,50%)] hover:text-[hsl(48,100%,70%)] hover:bg-[hsl(48,100%,50%)]/20 hover:border-[hsl(48,100%,50%)]/60 transition-all shadow-lg hover:shadow-[hsl(48,100%,50%)]/20 hover:scale-105"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[hsl(0,75%,15%)] border-[hsl(48,100%,50%)]">
            <DialogHeader>
              <DialogTitle className="text-[hsl(48,100%,50%)]">Settings</DialogTitle>
              <DialogDescription className="text-[hsl(48,100%,70%)]">
                Adjust AI voice and audio settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="volume" className="text-[hsl(48,100%,60%)] flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  AI Voice Volume
                </Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="volume"
                    min={0}
                    max={100}
                    step={5}
                    value={[volume]}
                    onValueChange={(value) => setVolume(value[0])}
                    className="flex-1"
                  />
                  <span className="text-[hsl(48,100%,70%)] min-w-[3rem] text-right">{volume}%</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="container mx-auto h-full max-w-[95%] px-2 sm:px-4 py-4 sm:py-8">
        <AnimatePresence mode="wait">
          {isIdle ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <IdleLogo onActivate={(lang) => {
                try { localStorage.setItem('language', lang); } catch {}
                // Changing language resets conversation to avoid cross-language context
                setMessages([]);
                try {
                  localStorage.removeItem('chatMessages');
                  localStorage.removeItem('chatSessionStart');
                } catch {}
                setLanguage(lang);
                setShowQuickActions(true);
                resetIdleTimer();
              }} />
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
                  onGoHome={handleGoHome}
                />
              </div>

              {/* Quick Actions or Chat */}
              <div className="flex-1 flex flex-col min-h-0 relative z-10">
                {showQuickActions ? (
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
                      onGoHome={handleGoHome}
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

