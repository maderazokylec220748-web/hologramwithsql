import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoImage from "@assets/westmead-removebg-preview_1760715284367.png";
import { GLBModel } from "@/components/hologram/GLBModel";
import { Button } from "@/components/ui/button";
import { Pause, Play, X } from "lucide-react";

export default function Hologram() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showTalking, setShowTalking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Debug: Log state changes
  useEffect(() => {
    console.log('[HOLOGRAM DEBUG] isSpeaking changed:', isSpeaking);
  }, [isSpeaking]);
  
  useEffect(() => {
    console.log('[HOLOGRAM DEBUG] showTalking changed:', showTalking);
  }, [showTalking]);
  
  useEffect(() => {
    console.log('[HOLOGRAM DEBUG] isPaused changed:', isPaused);
  }, [isPaused]);
  
  useEffect(() => {
    console.log('[HOLOGRAM DEBUG] audioLevel changed:', audioLevel.toFixed(3));
  }, [audioLevel]);
  
  // Web Audio API refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioDataRef = useRef<Uint8Array>(new Uint8Array(128));
  const audioLevelRef = useRef(0);
  const animationFrameRef = useRef<number>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Prevent duplicate connections
    if (wsRef.current) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('Hologram WebSocket connected');
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[HOLOGRAM DEBUG] WebSocket message received:', data);
        
        if (data.type === 'speaking') {
          console.log('[HOLOGRAM DEBUG] Speaking event - isSpeaking:', data.isSpeaking, 'text:', data.text?.substring(0, 50));
          setIsSpeaking(data.isSpeaking);
          
          // If speaking started and text is provided, play TTS audio
          if (data.isSpeaking && data.text) {
            console.log('[HOLOGRAM DEBUG] Starting TTS audio playback...');
            
            try {
              // Stop any existing audio
              if (audioRef.current) {
                console.log('[HOLOGRAM DEBUG] Stopping existing audio');
                audioRef.current.pause();
                audioRef.current = null;
              }
              
              // Request TTS audio
              console.log('[HOLOGRAM DEBUG] Requesting TTS from /api/tts');
              const ttsResponse = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: data.text })
              });
              
              if (!ttsResponse.ok) {
                console.error('[HOLOGRAM DEBUG] TTS request failed:', ttsResponse.status, ttsResponse.statusText);
                throw new Error('TTS failed');
              }
              
              console.log('[HOLOGRAM DEBUG] TTS response received, creating audio blob');
              const audioBlob = await ttsResponse.blob();
              const audioUrl = URL.createObjectURL(audioBlob);
              
              const audio = new Audio(audioUrl);
              audioRef.current = audio;
              console.log('[HOLOGRAM DEBUG] Audio element created');
              
              // Setup Web Audio API for mouth sync
              if (!audioContextRef.current) {
                console.log('[HOLOGRAM DEBUG] Creating AudioContext');
                audioContextRef.current = new AudioContext();
              }
              
              console.log('[HOLOGRAM DEBUG] Setting up Web Audio API analyser');
              const source = audioContextRef.current.createMediaElementSource(audio);
              const analyser = audioContextRef.current.createAnalyser();
              analyser.fftSize = 256;
              analyserRef.current = analyser;
              audioDataRef.current = new Uint8Array(analyser.frequencyBinCount);
              
              source.connect(analyser);
              analyser.connect(audioContextRef.current.destination);
              console.log('[HOLOGRAM DEBUG] Web Audio API connected');
              
              // Update audio level in real-time
              const updateAudioLevel = () => {
                if (analyserRef.current && audioDataRef.current) {
                  analyserRef.current.getByteFrequencyData(audioDataRef.current);
                  const average = audioDataRef.current.reduce((a, b) => a + b) / audioDataRef.current.length;
                  const normalizedLevel = average / 255;
                  
                  audioLevelRef.current = normalizedLevel;
                  setAudioLevel(normalizedLevel);
                  
                  if (audioRef.current && !audioRef.current.paused) {
                    requestAnimationFrame(updateAudioLevel);
                  } else {
                    audioLevelRef.current = 0;
                    setAudioLevel(0);
                    console.log('[HOLOGRAM DEBUG] Audio stopped or paused');
                  }
                }
              };
              
              audio.oncanplay = () => {
                console.log('[HOLOGRAM DEBUG] Audio can play, starting playback');
                audio.play().catch(e => console.error('[HOLOGRAM DEBUG] Audio play failed:', e));
                updateAudioLevel();
              };
              
              audio.onended = () => {
                console.log('[HOLOGRAM DEBUG] Audio playback ended');
                URL.revokeObjectURL(audioUrl);
                audioLevelRef.current = 0;
                setAudioLevel(0);
              };
              
              console.log('[HOLOGRAM DEBUG] Loading audio...');
              audio.load();
            } catch (error) {
              console.error('[HOLOGRAM DEBUG] TTS playback error:', error);
            }
          } else if (!data.isSpeaking) {
            console.log('[HOLOGRAM DEBUG] Speaking stopped, stopping audio');
            // Stop audio when speaking ends
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
            }
            setAudioLevel(0);
          }
        }
      } catch (error) {
        console.error('[HOLOGRAM DEBUG] WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Hologram WebSocket closed');
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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Keep talking heads visible for 1 minute after speaking stops
  useEffect(() => {
    console.log('[HOLOGRAM DEBUG] Visibility check - isSpeaking:', isSpeaking, 'isPaused:', isPaused, 'showTalking:', showTalking);
    
    if (isSpeaking && !isPaused) {
      console.log('[HOLOGRAM DEBUG] Setting showTalking = true (AI is speaking)');
      setShowTalking(true);
    } else if (!isSpeaking) {
      console.log('[HOLOGRAM DEBUG] Starting 60s timer before hiding models');
      const timer = setTimeout(() => {
        console.log('[HOLOGRAM DEBUG] Timer expired, setting showTalking = false');
        setShowTalking(false);
      }, 60000); // 1 minute delay

      return () => {
        console.log('[HOLOGRAM DEBUG] Clearing visibility timer');
        clearTimeout(timer);
      };
    }
  }, [isSpeaking, isPaused]);

  // Handle pause state - stop audio when paused
  useEffect(() => {
    if (isPaused && audioRef.current) {
      audioRef.current.pause();
      setAudioLevel(0);
    }
  }, [isPaused]);

  // Realistic AI Talking Head component
  const TalkingHead = ({ rotation }: { rotation: number }) => (
    <div 
      className="absolute w-1/3 flex items-center justify-center"
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center',
        ...(rotation === 0 && { top: 0, left: '50%', transform: `translateX(-50%) rotate(${rotation}deg)` }),
        ...(rotation === 180 && { bottom: 0, left: '50%', transform: `translateX(-50%) rotate(${rotation}deg)` }),
        ...(rotation === -90 && { left: 0, top: '50%', transform: `translateY(-50%) rotate(${rotation}deg)` }),
        ...(rotation === 90 && { right: 0, top: '50%', transform: `translateY(-50%) rotate(${rotation}deg)` })
      }}
    >
      <div className="relative">
        {/* Outer glow aura */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -inset-12 rounded-full bg-gradient-to-r from-[hsl(48,100%,50%)] to-[hsl(200,100%,50%)] blur-3xl"
        />

        {/* Head silhouette */}
        <div className="relative">
          {/* Face container */}
          <div className="relative w-48 h-56 bg-gradient-to-b from-[hsl(30,25%,35%)] to-[hsl(30,20%,25%)] rounded-[50%] border-4 border-[hsl(48,100%,50%)] overflow-hidden shadow-2xl">
            
            {/* Forehead highlight */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-20 h-12 bg-gradient-to-b from-[hsl(30,30%,45%)] to-transparent rounded-full blur-sm opacity-60" />
            
            {/* Eyes */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-12">
              {/* Left Eye */}
              <div className="relative">
                <motion.div 
                  animate={{ scaleY: isSpeaking ? [1, 0.2, 1, 0.2, 1] : [1, 0.1, 1] }}
                  transition={{ 
                    duration: isSpeaking ? 0.4 : 3,
                    repeat: Infinity,
                    repeatDelay: isSpeaking ? 0 : 2
                  }}
                  className="w-5 h-7 bg-[hsl(200,60%,50%)] rounded-full relative overflow-hidden"
                >
                  {/* Pupil */}
                  <motion.div 
                    animate={{ 
                      x: isSpeaking ? [0, 2, -2, 0] : 0,
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full"
                  >
                    {/* Eye shine */}
                    <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white rounded-full opacity-90" />
                  </motion.div>
                </motion.div>
                {/* Eyelid */}
                <div className="absolute -top-1 -left-1 w-7 h-4 bg-[hsl(30,25%,35%)] rounded-t-full" />
              </div>
              
              {/* Right Eye */}
              <div className="relative">
                <motion.div 
                  animate={{ scaleY: isSpeaking ? [1, 0.2, 1, 0.2, 1] : [1, 0.1, 1] }}
                  transition={{ 
                    duration: isSpeaking ? 0.4 : 3,
                    repeat: Infinity,
                    repeatDelay: isSpeaking ? 0 : 2
                  }}
                  className="w-5 h-7 bg-[hsl(200,60%,50%)] rounded-full relative overflow-hidden"
                >
                  {/* Pupil */}
                  <motion.div 
                    animate={{ 
                      x: isSpeaking ? [0, 2, -2, 0] : 0,
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full"
                  >
                    {/* Eye shine */}
                    <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white rounded-full opacity-90" />
                  </motion.div>
                </motion.div>
                {/* Eyelid */}
                <div className="absolute -top-1 -left-1 w-7 h-4 bg-[hsl(30,25%,35%)] rounded-t-full" />
              </div>
            </div>

            {/* Nose bridge shadow */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 w-2 h-12 bg-gradient-to-b from-transparent via-[hsl(30,20%,20%)] to-transparent opacity-40" />
            
            {/* Nose */}
            <div className="absolute top-32 left-1/2 -translate-x-1/2 w-8 h-6">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-3 bg-[hsl(30,25%,30%)] rounded-full" />
              <div className="absolute bottom-0 left-2 w-1.5 h-1.5 bg-[hsl(30,15%,20%)] rounded-full" />
              <div className="absolute bottom-0 right-2 w-1.5 h-1.5 bg-[hsl(30,15%,20%)] rounded-full" />
            </div>

            {/* Mouth - realistic talking animation */}
            <div className="absolute top-40 left-1/2 -translate-x-1/2">
              <motion.div
                animate={isSpeaking ? {
                  height: [8, 18, 10, 20, 8],
                  width: [40, 35, 42, 36, 40],
                } : {
                  height: 8,
                  width: 40,
                }}
                transition={{ 
                  duration: 0.5,
                  repeat: isSpeaking ? Infinity : 0,
                }}
                className="bg-[hsl(0,40%,15%)] rounded-full relative overflow-hidden"
              >
                {/* Teeth */}
                {isSpeaking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.6, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-white rounded-sm"
                  />
                )}
              </motion.div>
              {/* Lips highlight */}
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-[hsl(0,30%,40%)] rounded-full opacity-50" />
            </div>

            {/* Chin shadow */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-gradient-to-b from-transparent to-[hsl(30,15%,20%)] rounded-full opacity-60" />

            {/* Hologram scan line */}
            <motion.div
              animate={{ y: ["-100%", "200%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute w-full h-1 bg-gradient-to-r from-transparent via-[hsl(48,100%,60%)] to-transparent opacity-40"
            />
          </div>

          {/* Sound wave visualization */}
          {isSpeaking && (
            <>
              <div className="absolute -left-20 top-1/2 -translate-y-1/2">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <motion.div
                    key={`left-${i}`}
                    animate={{
                      scale: [0, 2],
                      opacity: [0.8, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay,
                    }}
                    className="absolute w-12 h-12 border-2 border-[hsl(48,100%,50%)] rounded-full"
                    style={{ left: i * -16 }}
                  />
                ))}
              </div>
              
              <div className="absolute -right-20 top-1/2 -translate-y-1/2">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <motion.div
                    key={`right-${i}`}
                    animate={{
                      scale: [0, 2],
                      opacity: [0.8, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay,
                    }}
                    className="absolute w-12 h-12 border-2 border-[hsl(48,100%,50%)] rounded-full"
                    style={{ right: i * -16 }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Logo display for idle state
  const LogoDisplay = ({ rotation }: { rotation: number }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="absolute w-1/3"
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

  // 3D Model display component for 4 positions
  const Model3DDisplay = ({ rotation }: { rotation: number }) => {
    return (
      <div 
        className="absolute w-[40%] h-[40%]"
        style={{
          ...(rotation === 0 && { top: '-10%', left: '50%', transform: 'translateX(-50%)' }),
          ...(rotation === 180 && { bottom: '-10%', left: '50%', transform: 'translateX(-50%) rotate(180deg)' }),
          ...(rotation === -90 && { left: '-10%', top: '50%', transform: 'translateY(-50%) rotate(-90deg)' }),
          ...(rotation === 90 && { right: '-10%', top: '50%', transform: 'translateY(-50%) rotate(90deg)' })
        }}
      >
        <GLBModel 
          isSpeaking={isSpeaking} 
          rotation={rotation}
          audioLevel={audioLevel}
          analyserRef={analyserRef}
          audioDataRef={audioDataRef}
        />
      </div>
    );
  };

  const handleTogglePause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    
    if (newPausedState) {
      // Pause audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsSpeaking(false);
      setAudioLevel(0);
      
      // Notify Home page to stop
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'control',
          action: 'pause'
        }));
      }
    }
  };

  const handleClose = () => {
    if (window.confirm('Close hologram display?')) {
      window.close();
    }
  };

  return (
    <div 
      className="relative w-full h-screen bg-black overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Control buttons */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 right-4 z-50 flex gap-2"
          >
            <Button
              size="sm"
              variant="outline"
              onClick={handleTogglePause}
              className="bg-black/50 border-[hsl(48,100%,50%)] text-[hsl(48,100%,50%)] hover:bg-[hsl(48,100%,50%)] hover:text-black backdrop-blur-sm"
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClose}
              className="bg-black/50 border-red-500 text-red-500 hover:bg-red-500 hover:text-white backdrop-blur-sm"
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Four-sided face display */}
      <AnimatePresence mode="wait">
        {!showTalking ? (
          <motion.div key="logos" className="absolute inset-0">
            <LogoDisplay rotation={0} />
            <LogoDisplay rotation={180} />
            <LogoDisplay rotation={-90} />
            <LogoDisplay rotation={90} />
          </motion.div>
        ) : (
          <motion.div key="models" className="absolute inset-0">
            <Model3DDisplay rotation={0} />
            <Model3DDisplay rotation={180} />
            <Model3DDisplay rotation={-90} />
            <Model3DDisplay rotation={90} />
          </motion.div>
        )}
      </AnimatePresence>      
      {/* Debug Overlay */}
      <div className="absolute bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50">
        <div>isSpeaking: <span className={isSpeaking ? 'text-green-400' : 'text-red-400'}>{String(isSpeaking)}</span></div>
        <div>showTalking: <span className={showTalking ? 'text-green-400' : 'text-red-400'}>{String(showTalking)}</span></div>
        <div>isPaused: <span className={isPaused ? 'text-yellow-400' : 'text-gray-400'}>{String(isPaused)}</span></div>
        <div>audioLevel: <span className="text-blue-400">{audioLevel.toFixed(3)}</span></div>
        <div>Display: <span className="text-purple-400">{showTalking ? '3D MODELS' : 'LOGOS'}</span></div>
      </div>      
      {/* Pause indicator */}
      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-40">
          <div className="text-[hsl(48,100%,50%)] text-4xl font-bold animate-pulse">
            PAUSED
          </div>
        </div>
      )}
    </div>
  );
}
