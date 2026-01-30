// In-memory cache for school data with TTL (Time To Live)
// This reduces database queries and speeds up responses

interface CachedData {
  faqs: any[];
  professors: any[];
  facilities: any[];
  events: any[];
  timestamp: number;
}

let cache: CachedData | null = null;
const CACHE_TTL = 5 * 60 * 1000; // Refresh every 5 minutes (adjust as needed)

export async function loadAndCacheData() {
  try {
    const { storage } = await import('./storage.js');
    
    cache = {
      faqs: await storage.getActiveFaqs(),
      professors: await storage.getAllProfessors(),
      facilities: await storage.getAllFacilities(),
      events: await storage.getUpcomingEvents(),
      timestamp: Date.now()
    };
    
    console.log('✅ School data cached:', {
      faqs: cache.faqs.length,
      professors: cache.professors.length,
      facilities: cache.facilities.length,
      events: cache.events.length
    });
    
    return cache;
  } catch (error) {
    console.error('❌ Failed to load cache:', error);
    return null;
  }
}

export function isCacheValid(): boolean {
  return cache !== null && (Date.now() - cache.timestamp) < CACHE_TTL;
}

export async function getSchoolData() {
  // If cache is valid, return it immediately (no database query!)
  if (isCacheValid() && cache) {
    return cache;
  }
  
  // Otherwise reload from database
  return await loadAndCacheData();
}

export function getCachedFaqs() {
  return cache?.faqs || [];
}

export function getCachedProfessors() {
  return cache?.professors || [];
}

export function getCachedFacilities() {
  return cache?.facilities || [];
}

export function getCachedEvents() {
  return cache?.events || [];
}
