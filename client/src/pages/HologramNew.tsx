import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import logoImage from "@assets/westmead-removebg-preview_1760715284367.png";
import kirkImage from "C:/Users/Bhojo/Downloads/hologramwithsql-main/hologramwithsql-main/client/src/assets/kirk.jpeg";

export default function HologramNew() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showClickPrompt, setShowClickPrompt] = useState(true);
  const audioReadyRef = useRef(false);
  
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
          
            setIsSpeaking(true);
            // Audio handling removed - TTS service not configured
            // To enable, configure a TTS service and uncomment audio code
          
          } else if (!data.isSpeaking) {
            console.log('[Hologram] Received stop signal');
            setAudioLevel(0);
            setIsSpeaking(false);
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

      {/* 4-Sided Image Display - always rendered, toggle visibility */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isSpeaking ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Top Image - Normal orientation */}
            <motion.div
              initial={{ opacity: 0, y: -60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute"
              style={{ top: '5%', left: '50%', transform: 'translateX(-50%)' }}
            >
              <div className="w-96 h-[28rem] rounded-lg overflow-hidden shadow-2xl">
                <img
                  src={kirkImage}
                  alt="Top Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            {/* Right Image - Rotated 90 degrees clockwise */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="absolute"
              style={{ right: '5%', top: '50%', transform: 'translateY(-50%)' }}
            >
              <div className="w-96 h-[28rem] rounded-lg overflow-hidden shadow-2xl">
                <img
                  src={kirkImage}
                  alt="Right Profile"
                  className="w-full h-full object-cover rotate-90"
                />
              </div>
            </motion.div>

            {/* Bottom Image - Rotated 180 degrees */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="absolute"
              style={{ bottom: '5%', left: '50%', transform: 'translateX(-50%)' }}
            >
              <div className="w-96 h-[28rem] rounded-lg overflow-hidden shadow-2xl">
                <img
                  src={kirkImage}
                  alt="Bottom Profile"
                  className="w-full h-full object-cover rotate-180"
                />
              </div>
            </motion.div>

            {/* Left Image - Rotated 270 degrees (or -90) */}
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="absolute"
              style={{ left: '5%', top: '50%', transform: 'translateY(-50%)' }}
            >
              <div className="w-96 h-[28rem] rounded-lg overflow-hidden shadow-2xl">
                <img
                  src={kirkImage}
                  alt="Left Profile"
                  className="w-full h-full object-cover -rotate-90"
                />
              </div>
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
