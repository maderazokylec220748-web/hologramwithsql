import { motion, AnimatePresence } from "framer-motion";

interface AvatarDisplayProps {
  isSpeaking: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  audioLevel?: number;
  onGoHome?: () => void;
}

export function AvatarDisplay({ isSpeaking, isMuted, onToggleMute, onGoHome }: AvatarDisplayProps) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Avatar container with glow */}
      <div className="relative">
        {/* Outer glow ring - pulses when speaking */}
        <motion.div
          animate={{
            scale: isSpeaking ? [1, 1.1, 1] : 1,
            opacity: isSpeaking ? [0.5, 0.8, 0.5] : 0.3,
          }}
          transition={{ duration: 0.8, repeat: isSpeaking ? Infinity : 0 }}
          className="absolute -inset-4 rounded-full bg-gradient-to-r from-[hsl(48,100%,50%)] to-[hsl(0,75%,28%)] blur-xl"
        />

        {/* Middle glow ring */}
        <div className="absolute -inset-2 rounded-full border-4 border-[hsl(48,100%,50%)] opacity-40" />

        {/* Avatar circle */}
        <div 
          className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[hsl(0,75%,25%)] to-[hsl(0,75%,35%)] border-4 border-[hsl(48,100%,50%)] flex items-center justify-center overflow-hidden cursor-pointer hover:border-[hsl(48,100%,60%)] transition-colors"
          onClick={onGoHome}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onGoHome?.()}
          title="Return to home screen"
        >
          {/* AI Icon */}
          <motion.div
            animate={{
              rotate: isSpeaking ? [0, 5, -5, 0] : 0,
            }}
            transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
            className="text-4xl sm:text-5xl font-bold text-[hsl(48,100%,50%)]"
          >
            WIS
          </motion.div>

          {/* Speaking wave effect */}
          <AnimatePresence>
            {isSpeaking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[hsl(48,100%,50%)]"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Scanning line */}
        {isSpeaking && (
          <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
            <motion.div
              animate={{ y: ["-100%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="h-1 w-full bg-gradient-to-r from-transparent via-[hsl(48,100%,70%)] to-transparent"
            />
          </div>
        )}
      </div>

      {/* AI Name Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[hsl(0,75%,25%)] border border-[hsl(48,100%,50%)] backdrop-blur-sm"
      >
        <p className="text-xs sm:text-sm font-semibold text-[hsl(48,100%,50%)] tracking-wide">
          W.I.S. AI - Where Ideas Spark
        </p>
      </motion.div>
    </div>
  );
}
