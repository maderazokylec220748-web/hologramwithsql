import { useState, useRef, useEffect } from "react";
import { GLBModel } from "@/components/hologram/GLBModel";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

export default function AvatarTest() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioDataRef = useRef<Uint8Array | null>(null);
  const audioLevelRef = useRef<number>(0); // Ref for immediate updates without re-renders

  const testWithTTS = async () => {
    const testText = "Hello, this is a test of the text to speech system. Can you see my mouth moving?";
    
    setIsSpeaking(true);
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testText })
      });

      if (!response.ok) throw new Error('TTS failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Setup Web Audio API for analysis
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      console.log('Creating Web Audio API connection...');
      const source = audioContextRef.current.createMediaElementSource(audio);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      audioDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      
      source.connect(analyser);
      analyser.connect(audioContextRef.current.destination);
      console.log('Web Audio API connected successfully');
      
      // Update audio level in real-time
      let logCount = 0;
      const updateAudioLevel = () => {
        if (analyserRef.current && audioDataRef.current) {
          analyserRef.current.getByteFrequencyData(audioDataRef.current);
          const average = audioDataRef.current.reduce((a, b) => a + b) / audioDataRef.current.length;
          const normalizedLevel = average / 255;
          
          // Update both ref (for immediate access) and state (for UI)
          audioLevelRef.current = normalizedLevel;
          setAudioLevel(normalizedLevel);
          
          // Log every 30 frames (~0.5s) for debugging
          if (logCount++ % 30 === 0) {
            console.log('Audio analysis - average:', average.toFixed(1), 'normalized:', normalizedLevel.toFixed(3));
          }
          
          if (audioRef.current && !audioRef.current.paused) {
            requestAnimationFrame(updateAudioLevel);
          } else {
            audioLevelRef.current = 0;
            setAudioLevel(0);
            console.log('Audio stopped or paused');
          }
        }
      };
      
      audioRef.current.oncanplay = () => {
        audioRef.current?.play();
        updateAudioLevel();
      };
      
      audioRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        audioLevelRef.current = 0;
        setAudioLevel(0);
        setIsSpeaking(false);
      };
      
      audioRef.current.load();
    } catch (error) {
      console.error('TTS test failed:', error);
      setIsSpeaking(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setAudioLevel(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(0,75%,15%)] via-[hsl(0,75%,20%)] to-[hsl(0,75%,25%)] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-[hsl(48,100%,50%)]">
            Avatar Mouth Movement Test
          </h1>
          <p className="text-white/80">
            Test the 3D avatar's lip-sync with audio
          </p>
        </div>

        {/* 3D Avatar Display */}
        <div className="relative w-full h-[500px] bg-black/30 rounded-2xl border-4 border-[hsl(48,100%,50%)] overflow-hidden">
          <GLBModel 
            isSpeaking={isSpeaking} 
            audioLevel={audioLevel}
            analyserRef={analyserRef}
            audioDataRef={audioDataRef}
          />
          
          {/* Audio Level Indicator */}
          <div className="absolute top-4 left-4 bg-black/70 p-4 rounded-lg">
            <p className="text-white text-sm mb-2">Audio Level</p>
            <div className="w-48 h-4 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-75"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
            <p className="text-white/60 text-xs mt-1">
              {(audioLevel * 100).toFixed(1)}%
            </p>
          </div>

          {/* Status Indicator */}
          <div className="absolute top-4 right-4 bg-black/70 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div 
                className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}
              />
              <span className="text-white text-sm">
                {isSpeaking ? 'Speaking' : 'Idle'}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={testWithTTS}
            disabled={isSpeaking}
            className="bg-[hsl(48,100%,50%)] text-black hover:bg-[hsl(48,100%,60%)] px-8 py-6 text-lg"
          >
            <Volume2 className="mr-2" />
            Test with TTS
          </Button>
          
          <Button
            onClick={stopAudio}
            disabled={!isSpeaking}
            variant="outline"
            className="border-[hsl(48,100%,50%)] text-[hsl(48,100%,50%)] hover:bg-[hsl(48,100%,50%)] hover:text-black px-8 py-6 text-lg"
          >
            <VolumeX className="mr-2" />
            Stop
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-black/30 p-6 rounded-lg border border-[hsl(48,100%,50%)]">
          <h3 className="text-[hsl(48,100%,50%)] font-bold mb-3">Instructions:</h3>
          <ol className="text-white/80 space-y-2 list-decimal list-inside">
            <li>Click "Test with TTS" to generate speech</li>
            <li>Watch the avatar - the mouth should move with the audio</li>
            <li>Check the audio level bar - it shows sound amplitude</li>
            <li>Open browser console (F12) to see model structure logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
