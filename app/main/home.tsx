import { getUserProfile } from '@/services/firestoreService';
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
  getTopAndAllMatches,
  matchPatientToTrials,
} from '../../logic/filteringLogic';

export default function HomeScreen() {
  const [userProfile, setUserProfile] = useState<PatientProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [topMatches, setTopMatches] = useState<Study[]>([]);
  const [allTrials, setAllTrials] = useState<Study[]>([]);
  const [locationMatches, setLocationMatches] = useState<Study[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasActiveSearch, setHasActiveSearch] = useState(false);

  // Load user profile on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Auto-load trials when profile is loaded (no location)
  useEffect(() => {
    if (userProfile && !hasActiveSearch) {
      loadTrialsWithoutLocation();
    }
  }, [userProfile]);

  const loadUserProfile = async () => {
    try {
      const user = auth().currentUser;
      if (!user) {
        setProfileLoading(false);
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
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadTrialsWithoutLocation = async () => {
    if (!userProfile) return;

    setLoading(true);
    try {
      const results = await getTopAndAllMatches(userProfile);
      setTopMatches(results.topMatches);
      setAllTrials(results.filteredTrials);
      setLocationMatches([]);
    } catch (error) {
      console.error('Error loading trials:', error);
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
      setAllTrials([]);
      setHasActiveSearch(true);
    } catch (error) {
      console.error('Error loading location trials:', error);
    } finally {
      setIsSearching(false);
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
    loadTrialsWithoutLocation();
  };

  const handleTrialPress = (trial: Study) => {
    console.log(
      'Trial pressed:',
      trial.protocolSection?.identificationModule?.briefTitle,
    );
    // TODO: Navigate to trial details screen
  };

  if (profileLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6BBF73" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back</Text>
        <Text style={styles.conditionText}>
          Find the best clinical trials you
        </Text>
      </View>

      {/* Location Search Bar with Search Button */}
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
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Conditionally render based on active search */}
      {hasActiveSearch ? (
        <HomeScreenWithLocation
          locationSearch={locationSearch}
          locationMatches={locationMatches}
          isLoading={isSearching}
          onClearSearch={clearSearch}
          onTrialPress={handleTrialPress}
        />
      ) : (
        <HomeScreenWithoutLocation
          topMatches={topMatches}
          allTrials={allTrials}
          isLoading={loading}
          onTrialPress={handleTrialPress}
          userCondition={userProfile?.condition}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
  setupButton: {
    backgroundColor: '#6BBF73',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  setupButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  conditionText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  conditionHighlight: {
    color: '#6BBF73',
    fontWeight: '600',
  },
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
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#999',
    fontWeight: 'bold',
  },
  searchButton: {
    backgroundColor: '#6BBF73',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    margin: 16,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
