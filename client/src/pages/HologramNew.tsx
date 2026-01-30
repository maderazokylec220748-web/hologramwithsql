import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import logoImage from "@assets/westmead-removebg-preview_1760715284367.png";

export default function HologramNew() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showClickPrompt, setShowClickPrompt] = useState(true);
  const audioReadyRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const syntheisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSpeakingRef = useRef(false); // Track if actually speaking to prevent premature hiding
  
  // Web Audio API refs (same as AvatarTest)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioDataRef = useRef<Uint8Array | null>(null);
  const audioLevelRef = useRef<number>(0);
  
  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize AudioContext on first user interaction
  useEffect(() => {
    const initAudio = async () => {
      if (!audioReadyRef.current) {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        audioReadyRef.current = true;
      }
    };

    // Add one-time click listener for the whole page
    const handleClick = () => {
      initAudio();
      setShowClickPrompt(false);
      document.removeEventListener('click', handleClick);
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // WebSocket connection for receiving speech commands from Home page
  useEffect(() => {
    if (wsRef.current) return; // Prevent duplicate connections

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[Hologram] WebSocket connected');
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[Hologram] WebSocket message received:', JSON.stringify(data, null, 2));
        
        if (data.type === 'speaking') {
          console.log('[Hologram] Speaking event - isSpeaking:', data.isSpeaking, 'text length:', data.text?.length || 0);
          
          if (data.isSpeaking && data.text) {
            console.log('[Hologram] Starting TTS for text:', data.text.substring(0, 50) + '...');
          
            // Use Web Speech API for text-to-speech
            try {
              const utterance = new SpeechSynthesisUtterance(data.text);
              
              // Get available voices
              const voices = window.speechSynthesis.getVoices();
              console.log('[Hologram] Available voices:', voices.map(v => v.name));
              
              if (voices.length > 0) {
                // Try to find Juniper voice specifically
                const juniperVoice = voices.find(v => v.name.toLowerCase().includes('juniper'));
                
                if (juniperVoice) {
                  utterance.voice = juniperVoice;
                  console.log('[Hologram] Selected Juniper voice');
                } else {
                  // Fallback to first available voice if Juniper not found
                  utterance.voice = voices[0];
                  console.log('[Hologram] Juniper not found, using:', voices[0].name);
                }
              }
              
              // Normal speech speed with protection against cutoff
              utterance.rate = 0.9; // Normal speed
              utterance.pitch = 1.1;
              utterance.volume = 1;
              
              // Split text into sentences properly - combine punctuation with text
              const rawSentences = data.text.split(/(?<=[.!?])\s+/);
              const sentences = rawSentences.filter(s => s.trim().length > 0);
              console.log(`[Hologram] Split into ${sentences.length} sentences:`, sentences);
              
              // Function to speak chunks sequentially
              let chunkIndex = 0;
              
              const speakNextChunk = () => {
                if (chunkIndex >= sentences.length) {
                  console.log('[Hologram] All chunks spoken - waiting 1 second then stopping');
                  // All done - wait a bit then stop video to ensure last audio completes
                  setTimeout(() => {
                    console.log('[Hologram] All speech complete - stopping video now');
                    window.speechSynthesis.cancel();
                    isSpeakingRef.current = false;
                    setIsSpeaking(false);
                    
                    if (videoRef.current) {
                      videoRef.current.pause();
                      videoRef.current.currentTime = 0;
                    }
                  }, 1000); // Wait 1 second after last chunk
                  return;
                }
                
                const chunkText = sentences[chunkIndex].trim();
                if (!chunkText) {
                  chunkIndex++;
                  speakNextChunk();
                  return;
                }
                
                console.log(`[Hologram] Speaking chunk ${chunkIndex + 1}/${sentences.length}: "${chunkText}"`);
                
                const chunkUtterance = new SpeechSynthesisUtterance(chunkText);
                chunkUtterance.rate = 0.9;
                chunkUtterance.pitch = 1.1;
                chunkUtterance.volume = 1;
                
                // Use Juniper voice for this chunk too
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                  const juniperVoice = voices.find(v => v.name.toLowerCase().includes('juniper'));
                  if (juniperVoice) {
                    chunkUtterance.voice = juniperVoice;
                  } else {
                    chunkUtterance.voice = voices[0];
                  }
                }
                
                chunkUtterance.onend = () => {
                  console.log(`[Hologram] Chunk ${chunkIndex + 1}/${sentences.length} finished`);
                  // Move to next chunk
                  chunkIndex++;
                  speakNextChunk();
                };
                
                chunkUtterance.onerror = (event) => {
                  console.log('[Hologram] Chunk error:', event.error);
                  chunkIndex++;
                  speakNextChunk(); // Move to next chunk even if error
                };
                
                window.speechSynthesis.speak(chunkUtterance);
              };
              
              syntheisRef.current = utterance;
              
              // START VIDEO AND SET SPEAKING STATE
              console.log('[Hologram] Starting video and speech');
              isSpeakingRef.current = true; // Mark as speaking in ref
              setIsSpeaking(true);
              if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play().catch(err => console.log('[Hologram] Video play error:', err));
              }
              
              // Don't use keep-alive interval - the video has loop attribute
              // Just let it loop naturally while isSpeaking is true
              
              // Clear any previous speech
              window.speechSynthesis.cancel();
              
              // Start speaking chunks - video will loop until all chunks finish
              speakNextChunk();
            } catch (err) {
              console.log('[Hologram] TTS error:', err);
            }
          
          } else if (!data.isSpeaking) {
            console.log('[Hologram] Received stop signal');
            setAudioLevel(0);
            isSpeakingRef.current = false; // Mark as not speaking
            setIsSpeaking(false);
            
            // Cancel speech and stop video ONLY when explicitly told to stop
            window.speechSynthesis.cancel();
            if (videoRef.current) {
              videoRef.current.pause();
              videoRef.current.currentTime = 0;
            }
          }
        }
      } catch (error) {
        console.error('[Hologram] WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[Hologram] WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('[Hologram] WebSocket closed');
      wsRef.current = null;
    };

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Logo component for idle state (original design)
  const LogoDisplay = ({ rotation }: { rotation: number }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="absolute w-1/4"
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center',
        ...(rotation === 0 && { top: 0, left: '50%', transform: `translateX(-50%) rotate(${rotation}deg)` }),
        ...(rotation === 180 && { bottom: 0, left: '50%', transform: `translateX(-50%) rotate(${rotation}deg)` }),
        ...(rotation === -90 && { left: 0, top: '50%', transform: `translateY(-50%) rotate(${rotation}deg)` }),
        ...(rotation === 90 && { right: 0, top: '50%', transform: `translateY(-50%) rotate(${rotation}deg)` })
      }}
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 blur-2xl bg-[hsl(48,100%,50%)] opacity-20 animate-pulse" />
        <img
          src={logoImage}
          alt="Westmead"
          className="w-full h-auto relative z-10"
        />
      </div>
    </motion.div>
  );

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Subtle click prompt - disappears after first click */}
      {showClickPrompt && (
        <motion.div 
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/60 text-white px-4 py-2 rounded-full text-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          Click anywhere to enable audio
        </motion.div>
      )}

      {/* Logos - always rendered, toggle visibility */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isSpeaking ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <LogoDisplay rotation={0} />
        <LogoDisplay rotation={180} />
        <LogoDisplay rotation={-90} />
        <LogoDisplay rotation={90} />
      </div>

      {/* 4-Sided Video Display - shows when speaking */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isSpeaking ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Fullscreen Video Display */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                loop
                playsInline
                muted
                onEnded={(e) => {
                  // Prevent any interruption when video loops
                  console.log('[Hologram] Video ended, restarting...');
                  e.currentTarget.play();
                }}
              >
                <source src="/Untitled design.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Debug info (can be removed for production) */}
      <div className="absolute bottom-4 left-4 bg-black/80 text-white p-3 rounded text-xs font-mono">
        <div>Speaking: <span className={isSpeaking ? 'text-green-400' : 'text-red-400'}>{String(isSpeaking)}</span></div>
        <div>Audio Level: <span className="text-blue-400">{audioLevel.toFixed(3)}</span></div>
      </div>
    </div>
  );
}
