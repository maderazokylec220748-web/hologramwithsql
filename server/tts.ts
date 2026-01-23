import textToSpeech from '@google-cloud/text-to-speech';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Initialize Google Cloud TTS client with service account credentials (optional)
const credentialsPath = join(process.cwd(), 'gen-lang-client-0429761550-118859e3c5dc.json');
let client: textToSpeech.TextToSpeechClient | null = null;

if (existsSync(credentialsPath)) {
  try {
    const credentials = JSON.parse(readFileSync(credentialsPath, 'utf8'));
    client = new textToSpeech.TextToSpeechClient({
      credentials,
    });
    console.log('Google Cloud TTS initialized successfully');
  } catch (error) {
    console.warn('Failed to initialize Google Cloud TTS:', error);
  }
} else {
  console.warn('Google Cloud TTS credentials not found. TTS feature will be disabled.');
}

// In-memory cache for generated audio
const audioCache = new Map<string, Buffer>();
const MAX_CACHE_SIZE = 100; // Cache up to 100 audio responses

export async function generateSpeech(text: string): Promise<Buffer> {
  // Check if TTS client is available
  if (!client) {
    throw new Error('Google Cloud TTS is not configured. Please add credentials file.');
  }

  // Check cache first
  const cacheKey = text.toLowerCase().trim();
  const cached = audioCache.get(cacheKey);
  if (cached) {
    console.log('TTS cache hit');
    return cached;
  }
  try {
    const request = {
      input: { text },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Studio-M', // Fast, natural male voice (WaveNet quality)
        ssmlGender: 'MALE' as const,
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate: 1.0,
      },
    };

    const [response] = await client.synthesizeSpeech(request);
    
    if (!response.audioContent) {
      throw new Error('No audio content received from Google Cloud TTS');
    }

    const audioBuffer = Buffer.from(response.audioContent);
    
    // Cache the result
    if (audioCache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry
      const firstKey = audioCache.keys().next().value;
      audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, audioBuffer);
    console.log('TTS generated and cached');
    
    return audioBuffer;
  } catch (error) {
    console.error('Google Cloud TTS error:', error);
    throw error;
  }
}

