import { Colors } from '@/constants/colors';
import { getUserProfile } from '@/services/firestoreService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
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

export default function HomeScreen() {
  const [userProfile, setUserProfile] = useState<PatientProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [topMatches, setTopMatches] = useState<Study[]>([]);
  const [initialTrials, setInitialTrials] = useState<Study[]>([]);
  const [locationMatches, setLocationMatches] = useState<Study[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasActiveSearch, setHasActiveSearch] = useState(false);
  const [greeting, setGreeting] = useState('');

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    else if (hour < 17) return 'Good Afternoon';
    else return 'Good Evening';
  };

  useEffect(() => {
    loadUserProfile();
    setGreeting(getTimeBasedGreeting());
  }, []);

  useEffect(() => {
    if (userProfile && !hasActiveSearch) {
      loadInitialTrials();
    }
  }, [userProfile]);

  const loadUserProfile = async () => {
    try {
      const user = auth().currentUser;
      if (!user) {
        setProfileLoading(false);
        return;
      }

      const cachedProfile = await AsyncStorage.getItem('cachedUserProfile');
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile);
        const patientProfile: PatientProfile = {
          condition: parsed.condition,
          age: parsed.age,
          gender: parsed.gender,
        };
        setUserProfile(patientProfile);
        setProfileLoading(false);
        fetchAndUpdateProfile(user.uid);
        return;
      }

      const profile = await getUserProfile(user.uid);
      if (profile) {
        const patientProfile: PatientProfile = {
          condition: profile.condition,
          age: profile.age,
          gender: profile.gender,
        };
        setUserProfile(patientProfile);
        await AsyncStorage.setItem(
          'cachedUserProfile',
          JSON.stringify(patientProfile),
        );
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
        await AsyncStorage.setItem(
          'cachedUserProfile',
          JSON.stringify(patientProfile),
        );
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

      const firstPageTrials = await fetchFirstPageTrials(userProfile);
      setInitialTrials(firstPageTrials);

      setLocationMatches([]);
    } catch (error) {
      console.error('Error loading initial trials:', error);
    } finally {
      setLoading(false);
    }
  };

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
    loadInitialTrials();
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
          <ActivityIndicator size="large" color={Colors.primary} />
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
