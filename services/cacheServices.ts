import AsyncStorage from '@react-native-async-storage/async-storage';
import { PatientProfile, Study } from '../logic/api';

// Cache keys
const CACHE_KEYS = {
  USER_PROFILE: 'cachedUserProfile',
  SAVED_TRIALS: 'cachedSavedTrials',
  TOP_MATCHES: 'cachedTopMatches',
  ALL_TRIALS: 'cachedAllTrials',
  LAST_FETCH_TIME: 'lastFetchTime',
};

// Generic cache functions
export const saveToCache = async (key: string, data: any): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem(key, jsonValue);
    console.log(`✅ Cached saved to ${key}`);
  } catch (error) {
    console.error(`Error saving to cache (${key}):`, error);
  }
};

export const loadFromCache = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Error loading from cache (${key}):`, error);
    return null;
  }
};

export const clearCache = async (key?: string): Promise<void> => {
  try {
    if (key) {
      await AsyncStorage.removeItem(key);
      console.log(`✅ Cache cleared for ${key}`);
    } else {
      // Clear all app caches
      const keys = Object.values(CACHE_KEYS);
      await AsyncStorage.multiRemove(keys);
      console.log('✅ All caches cleared');
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Profile specific functions
export const cacheUserProfile = async (
  profile: PatientProfile,
): Promise<void> => {
  await saveToCache(CACHE_KEYS.USER_PROFILE, profile);
};

export const getCachedUserProfile =
  async (): Promise<PatientProfile | null> => {
    return await loadFromCache<PatientProfile>(CACHE_KEYS.USER_PROFILE);
  };

// Saved trials specific functions
export const cacheSavedTrials = async (trials: any[]): Promise<void> => {
  await saveToCache(CACHE_KEYS.SAVED_TRIALS, trials);
};

export const getCachedSavedTrials = async (): Promise<any[] | null> => {
  return await loadFromCache<any[]>(CACHE_KEYS.SAVED_TRIALS);
};

// Home screen specific functions
export const cacheTopMatches = async (matches: Study[]): Promise<void> => {
  await saveToCache(CACHE_KEYS.TOP_MATCHES, matches);
};

export const getCachedTopMatches = async (): Promise<Study[] | null> => {
  return await loadFromCache<Study[]>(CACHE_KEYS.TOP_MATCHES);
};

export const cacheAllTrials = async (trials: Study[]): Promise<void> => {
  await saveToCache(CACHE_KEYS.ALL_TRIALS, trials);
};

export const getCachedAllTrials = async (): Promise<Study[] | null> => {
  return await loadFromCache<Study[]>(CACHE_KEYS.ALL_TRIALS);
};

export const updateLastFetchTime = async (): Promise<void> => {
  await saveToCache(CACHE_KEYS.LAST_FETCH_TIME, Date.now());
};

export const shouldRefreshData = async (
  maxAgeMinutes: number = 30,
): Promise<boolean> => {
  const lastFetch = await loadFromCache<number>(CACHE_KEYS.LAST_FETCH_TIME);
  if (!lastFetch) return true;
  const minutesSinceLastFetch = (Date.now() - lastFetch) / (1000 * 60);
  return minutesSinceLastFetch > maxAgeMinutes;
};

export { CACHE_KEYS };
