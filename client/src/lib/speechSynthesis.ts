// Browser-based Text-to-Speech using Web Speech API (no external services needed)

export function useWebSpeechSynthesis() {
  const synth = window.speechSynthesis;
  let isSupported = !!synth;

  const speak = (text: string, onEnd?: () => void) => {
    if (!isSupported) {
      console.warn('Web Speech API not supported in this browser');
      if (onEnd) onEnd();
      return;
    }

    // Cancel any ongoing speech
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0; // Natural speaking rate
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0; // Full volume

    // Use a natural voice if available
    const voices = synth.getVoices();
    if (voices.length > 0) {
      // Prefer English voice
      const englishVoice = voices.find(v => v.lang.startsWith('en-'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      } else {
        utterance.voice = voices[0];
      }
    }

    utterance.onend = () => {
      console.log('Speech synthesis ended');
      if (onEnd) onEnd();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      if (onEnd) onEnd();
    };

    synth.speak(utterance);
    console.log('Speaking:', text.substring(0, 50) + '...');
  };

  const stop = () => {
    if (isSupported && synth.speaking) {
      synth.cancel();
    }
  };

  const isSpeaking = () => isSupported && synth.speaking;

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
  };
}
