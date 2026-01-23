import { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  shouldStop?: boolean;
}

export function TypewriterText({ text, speed = 30, onComplete, shouldStop = false }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textRef = useRef(text);

  // Reset when text changes
  useEffect(() => {
    if (textRef.current !== text) {
      textRef.current = text;
      setDisplayedText('');
      setCurrentIndex(0);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text]);

  // Handle typing animation
  useEffect(() => {
    // If shouldStop is true, immediately show all text
    if (shouldStop && displayedText !== text) {
      setDisplayedText(text);
      setCurrentIndex(text.length);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (onComplete) {
        onComplete();
      }
      return;
    }

    // Normal typing animation
    if (currentIndex < text.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
    } else if (currentIndex === text.length && currentIndex > 0 && onComplete) {
      onComplete();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, text, speed, onComplete, shouldStop]);

  // Split by newlines and render with proper line breaks
  const lines = displayedText.split('\n');
  
  return (
    <div className="space-y-2">
      {lines.map((line, index) => (
        <div key={index} className="min-h-[1.5em]">
          {line || '\u00A0'}
        </div>
      ))}
    </div>
  );
}
