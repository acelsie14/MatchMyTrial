import LoadingAnimation from '@/components/LoadingAnimation';
import { getUserProfile } from '@/services/firestoreService';
import auth from '@react-native-firebase/auth';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import HomeScreenWithLocation from '../../components/home/HomeScreenWithLocation';
import HomeScreenWithoutLocation from '../../components/home/HomeScreenWithoutLocation';
import { PatientProfile, Study } from '../../logic/api';
import {
  fetchFirstPageTrials,
  fetchTopMatches,
  matchPatientToTrials,
} from '../../logic/filteringLogic';
import {
  cacheAllTrials,
  cacheTopMatches,
  cacheUserProfile,
  getCachedAllTrials,
  getCachedTopMatches,
  getCachedUserProfile,
  updateLastFetchTime,
} from '../../services/cacheServices';

export default function HomeScreen() {
  const [userProfile, setUserProfile] = useState<PatientProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [topMatches, setTopMatches] = useState<Study[]>([]);
  const [initialTrials, setInitialTrials] = useState<Study[]>([]);
  const [locationMatches, setLocationMatches] = useState<Study[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCached, setLoadingCached] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasActiveSearch, setHasActiveSearch] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [cachedTopMatchesData, setCachedTopMatchesData] = useState<Study[]>([]);
  const [cachedTrialsData, setCachedTrialsData] = useState<Study[]>([]);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    else if (hour < 17) return 'Good Afternoon';
    else return 'Good Evening';
  };

  // Load cached data immediately
  useEffect(() => {
    const loadCachedData = async () => {
      setLoadingCached(true);
      try {
        // Load cached top matches
        const cachedTop = await getCachedTopMatches();
        if (cachedTop && cachedTop.length > 0) {
          setTopMatches(cachedTop);
          setCachedTopMatchesData(cachedTop);
          console.log('📦 Loaded top matches from cache');
        }

        // Load cached all trials
        const cachedTrials = await getCachedAllTrials();
        if (cachedTrials && cachedTrials.length > 0) {
          setInitialTrials(cachedTrials);
          setCachedTrialsData(cachedTrials);
          console.log('📦 Loaded trials from cache');
        }
      } catch (error) {
        console.error('Error loading cached data:', error);
      } finally {
        setLoadingCached(false);
      }
    };

    loadCachedData();
  }, []);

  useEffect(() => {
    loadUserProfile();
    setGreeting(getTimeBasedGreeting());
  }, []);

  useEffect(() => {
    if (userProfile && !hasActiveSearch && !loadingCached) {
      loadInitialTrials();
    }
  }, [userProfile, loadingCached]);

  const loadUserProfile = async () => {
    try {
      const user = auth().currentUser;
      if (!user) {
        setProfileLoading(false);
        return;
      }

      // Try cache first
      const cachedProfile = await getCachedUserProfile();
      if (cachedProfile) {
        setUserProfile(cachedProfile);
        setProfileLoading(false);
        console.log('📦 Profile loaded from cache');
        // Still fetch from Firestore in background
        fetchAndUpdateProfile(user.uid);
        return;
      }

      // No cache, load from Firestore
      const profile = await getUserProfile(user.uid);
      if (profile) {
        const patientProfile: PatientProfile = {
          condition: profile.condition,
          age: profile.age,
          gender: profile.gender,
        };
        setUserProfile(patientProfile);
        await cacheUserProfile(patientProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchAndUpdateProfile = async (userId: string) => {
    try {
      const profile = await getUserProfile(userId);
      if (profile) {
        const patientProfile: PatientProfile = {
          condition: profile.condition,
          age: profile.age,
          gender: profile.gender,
        };
        setUserProfile(patientProfile);
        await cacheUserProfile(patientProfile);
      }
    } catch (error) {
      console.error('Error updating profile from Firestore:', error);
    }
  };

  // ONLY fetch top matches and first page of trials (20 items) - FAST
  const loadInitialTrials = async () => {
    if (!userProfile) return;

    setLoading(true);
    try {
      const topMatchesData = await fetchTopMatches(userProfile);
      setTopMatches(topMatchesData);
      setCachedTopMatchesData(topMatchesData);
      await cacheTopMatches(topMatchesData);

      const firstPageTrials = await fetchFirstPageTrials(userProfile);
      setInitialTrials(firstPageTrials);
      setCachedTrialsData(firstPageTrials);
      await cacheAllTrials(firstPageTrials);
      await updateLastFetchTime();

      setLocationMatches([]);
    } catch (error) {
      console.error('Error loading initial trials:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    if (!userProfile) return;

    console.log('🔄 REFRESH STARTED');
    setRefreshing(true);

    try {
      const user = auth().currentUser;
      if (user) {
        const freshProfile = await getUserProfile(user.uid);
        if (freshProfile) {
          const updatedProfile: PatientProfile = {
            condition: freshProfile.condition,
            age: freshProfile.age,
            gender: freshProfile.gender as 'male' | 'female',
          };

          setUserProfile(updatedProfile);
          await cacheUserProfile(updatedProfile);

          const topMatchesData = await fetchTopMatches(updatedProfile);
          const firstPageTrials = await fetchFirstPageTrials(updatedProfile);

          setTopMatches(topMatchesData);
          setCachedTopMatchesData(topMatchesData);
          await cacheTopMatches(topMatchesData);

          setInitialTrials(firstPageTrials);
          setCachedTrialsData(firstPageTrials);
          await cacheAllTrials(firstPageTrials);
          await updateLastFetchTime();

          console.log('✅ REFRESH COMPLETE');
        }
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [userProfile]);

  const loadTrialsWithLocation = async () => {
    if (!userProfile || !locationSearch.trim()) return;

    setIsSearching(true);
    try {
      const patientWithLocation = {
        ...userProfile,
        locationName: locationSearch.trim(),
      };
      const matches = await matchPatientToTrials(patientWithLocation);
      setLocationMatches(matches);
      setTopMatches([]);
      setInitialTrials([]);
      setHasActiveSearch(true);
    } catch (error) {
      console.error('Error loading location trials:', error);
    } finally {
      setTimeout(() => {
        setIsSearching(false);
      }, 500);
    }
  };

  const handleSearch = () => {
    if (!locationSearch.trim()) {
      clearSearch();
    } else {
      loadTrialsWithLocation();
    }
  };

  const clearSearch = () => {
    setLocationSearch('');
    setHasActiveSearch(false);
    setLocationMatches([]);

    // Restore from cached data WITHOUT making new API calls
    setTopMatches(cachedTopMatchesData);
    setInitialTrials(cachedTrialsData);
  };

  const handleTrialPress = (trial: Study) => {
    router.push({
      pathname: '/trialDetail',
      params: { trial: JSON.stringify(trial) },
    });
  };

  if (profileLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.splashLogoContainer}>
          <Text style={styles.splashEmoji}>🩺</Text>
        </View>
        <Text style={styles.splashAppName}>MatchMyTrial</Text>
        <Text style={styles.splashTagline}>
          Finding your perfect clinical trial match
        </Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Please complete your profile setup first.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/profileSetup')}
          style={styles.setupButton}
        >
          <Text style={styles.setupButtonText}>Go to Profile Setup</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.welcomeText}>{greeting} 👋</Text>
        <Text style={styles.conditionText}>
          Find the best clinical trials for you
        </Text>
      </View>

      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by location (city, state, or country)"
            placeholderTextColor="#999"
            value={locationSearch}
            onChangeText={setLocationSearch}
            onSubmitEditing={handleSearch}
          />
          {hasActiveSearch && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.searchButton,
            isSearching && styles.searchButtonDisabled,
          ]}
          onPress={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {isSearching && (
        <View style={styles.searchingContainer}>
          {/* <ActivityIndicator size="large" color={Colors.primary} /> */}
          <LoadingAnimation />
          <Text style={styles.searchingText}>
            Searching for trials in {locationSearch}...
          </Text>
        </View>
      )}

      {!isSearching &&
        (hasActiveSearch ? (
          <HomeScreenWithLocation
            locationSearch={locationSearch}
            locationMatches={locationMatches}
            isLoading={false}
            onClearSearch={clearSearch}
            onTrialPress={handleTrialPress}
          />
        ) : (
          <HomeScreenWithoutLocation
            topMatches={topMatches}
            allTrials={initialTrials}
            isLoading={loading}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onTrialPress={handleTrialPress}
            userCondition={userProfile?.condition}
            userProfile={userProfile}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: { marginTop: 10, color: '#666' },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 16 },
  setupButton: {
    backgroundColor: '#6BBF73',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  setupButtonText: { color: '#fff', fontWeight: 'bold' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  conditionText: { fontSize: 16, color: '#666', marginTop: 4 },
  searchWrapper: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#1a1a1a' },
  clearButton: { padding: 8 },
  clearButtonText: { fontSize: 16, color: '#999', fontWeight: 'bold' },
  searchButton: {
    backgroundColor: '#6BBF73',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  searchButtonDisabled: { backgroundColor: '#a8d4a8' },
  searchButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 60,
  },
  searchingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6BBF73',
  },
  splashLogoContainer: {
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 1,
  },
  splashEmoji: { fontSize: 60 },
  splashAppName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  splashTagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});
