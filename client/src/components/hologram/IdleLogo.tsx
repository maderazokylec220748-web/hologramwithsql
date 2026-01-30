import { motion } from "framer-motion";
import { useState } from "react";
import logoImage from "@assets/image_1760701271607.png";

interface IdleLogoProps {
  onActivate: (lang: 'en' | 'tl') => void;
}

export function IdleLogo({ onActivate }: IdleLogoProps) {
  const [showLangOptions, setShowLangOptions] = useState(false);

  return (
    <div className="relative w-full h-full">
      {!showLangOptions ? (
        <div
          className="relative w-full h-full cursor-pointer"
          onClick={() => setShowLangOptions(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setShowLangOptions(true)}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-[hsl(48,100%,50%)] to-[hsl(0,75%,25%)] opacity-30 animate-pulse-glow" />

              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <img
                  src={logoImage}
                  alt="Westmead International School"
                  className="w-64 h-auto relative z-10"
                />
              </motion.div>

              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-[hsl(48,100%,70%)] to-transparent opacity-50 animate-hologram-scan" />
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mt-12 text-xl font-medium text-[hsl(45,30%,98%)] tracking-wide text-center"
            >
              Ask me anything about Westmead
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="mt-4 text-sm text-[hsl(45,30%,70%)] tracking-wide text-center"
            >
              Click anywhere to start
            </motion.p>

            <div className="flex gap-3 mt-6">
              {[0, 0.2, 0.4].map((delay, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay,
                  }}
                  className="w-2 h-2 rounded-full bg-[hsl(48,100%,50%)]"
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="bg-[hsl(0,75%,10%)] border border-[hsl(48,100%,50%)] rounded-lg p-8 sm:p-10 flex flex-col items-center gap-6 sm:gap-8"
          >
            <div className="text-2xl sm:text-3xl font-semibold text-[hsl(48,100%,50%)]">Choose language</div>
            <div className="flex gap-6 sm:gap-8">
              <button
                className="px-8 sm:px-10 py-3 sm:py-4 rounded bg-[hsl(48,100%,50%)] text-black font-bold text-lg sm:text-xl shadow"
                onClick={() => onActivate('en')}
              >
                English
              </button>
              <button
                className="px-8 sm:px-10 py-3 sm:py-4 rounded bg-[hsl(0,75%,30%)] text-white font-bold text-lg sm:text-xl shadow"
                onClick={() => onActivate('tl')}
              >
                Tagalog
              </button>
            </div>
            <button
              className="mt-2 text-base sm:text-lg text-[hsl(45,30%,70%)] underline"
              onClick={() => setShowLangOptions(false)}
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
