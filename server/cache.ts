// Simple in-memory cache for frequently asked questions
interface CacheEntry {
  answer: string;
  speechText: string;
  timestamp: number;
  hitCount: number;
}

class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly TTL = 3600000; // 1 hour
  private readonly MAX_SIZE = 100;

  normalize(question: string): string {
    return question
      .toLowerCase()
      .trim()
      .replace(/[?!.,]/g, '')
      .replace(/\s+/g, ' ');
  }

  get(question: string): CacheEntry | null {
    const key = this.normalize(question);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    // Increment hit count
    entry.hitCount++;
    return entry;
  }

  set(question: string, answer: string, speechText: string): void {
    const key = this.normalize(question);

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.MAX_SIZE) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      answer,
      speechText,
      timestamp: Date.now(),
      hitCount: 0,
    });
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      totalHits: entries.reduce((sum, e) => sum + e.hitCount, 0),
      mostPopular: Array.from(this.cache.entries())
        .sort((a, b) => b[1].hitCount - a[1].hitCount)
        .slice(0, 5)
        .map(([question, entry]) => ({ question, hits: entry.hitCount })),
    };
  }

  clear(): void {
    this.cache.clear();
  }
}

export const responseCache = new ResponseCache();
