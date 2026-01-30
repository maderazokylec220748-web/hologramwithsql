import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { platform } from 'os';

// Try to detect espeak availability
let ttsAvailable = false;
try {
  execSync('which espeak 2>/dev/null || where espeak', { stdio: 'ignore' });
  ttsAvailable = true;
  console.log('✓ TTS available: espeak found');
} catch {
  console.log('ℹ️ Server-side TTS disabled. Using browser Web Speech API instead.');
  console.log('   Audio will be generated client-side (no external services needed)');
}

// In-memory cache for generated audio
const audioCache = new Map<string, Buffer>();
const MAX_CACHE_SIZE = 100; // Cache up to 100 audio responses

export async function generateSpeech(text: string): Promise<Buffer> {
  // If TTS unavailable, return empty buffer - client will use Web Speech API instead
  if (!ttsAvailable) {
    // Return empty buffer - frontend will handle audio generation via Web Speech API
    return Buffer.alloc(0);
  }

  // Check cache first
  const cacheKey = text.toLowerCase().trim();
  const cached = audioCache.get(cacheKey);
  if (cached) {
    console.log('TTS cache hit');
    return cached;
  }

  try {
    // Create temp file for output
    const tempFile = join(tmpdir(), `tts-${Date.now()}.wav`);
    
    // Use espeak to generate WAV audio
    // -a 100 = amplitude, -s 150 = speed (words per minute), -w = write to WAV file
    execSync(`espeak -a 100 -s 150 -w "${tempFile}" "${text.replace(/"/g, '\\"')}"`, { 
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024
    });
    
    // Read the generated WAV file
    const { readFileSync } = await import('fs');
    const audioBuffer = readFileSync(tempFile);
    
    // Clean up temp file
    try {
      unlinkSync(tempFile);
    } catch {
      // Ignore cleanup errors
    }
    
    // Cache the result
    if (audioCache.size >= MAX_CACHE_SIZE) {
      const firstKey = audioCache.keys().next().value;
      audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, audioBuffer);
    console.log('TTS generated and cached');
    
    return audioBuffer;
  } catch (error) {
    console.error('Espeak TTS error:', error);
    // Return empty buffer on error - client will use Web Speech API
    return Buffer.alloc(0);
  }
}

