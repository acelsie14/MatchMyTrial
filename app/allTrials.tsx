import LoadingAnimation from '@/components/LoadingAnimation';
import { Colors } from '@/constants/colors';
import { AntDesign } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PatientProfile } from '../logic/api';
import { fetchAllTrials } from '../logic/filteringLogic';

export default function AllTrialsScreen() {
  const params = useLocalSearchParams();
  const [trials, setTrials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const condition = params.condition as string;
  const age = parseInt(params.age as string);
  const gender = params.gender as string;

  useEffect(() => {
    loadAllTrials();
  }, []);

  const loadAllTrials = async () => {
    try {
      const patientProfile: PatientProfile = {
        condition: condition,
        age: age,
        gender: gender as 'male' | 'female',
      };

      const allTrials = await fetchAllTrials(patientProfile);
      setTrials(allTrials);
    } catch (err) {
      console.error('Error loading all trials:', err);
      setError('Failed to load trials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const VerticalTrialCard = ({
    trial,
    index,
  }: {
    trial: any;
    index: number;
  }) => {
    const location =
      trial.protocolSection?.contactsLocationsModule?.locations?.[0];
    const city = location?.city || '';
    const country = location?.country || '';
    const locationText =
      city && country
        ? `${city}, ${country}`
        : city || country || 'Location not specified';

    return (
      <TouchableOpacity
        style={styles.verticalCard}
        onPress={() => {
          router.push({
            pathname: '/trialDetail',
            params: { trial: JSON.stringify(trial) },
          });
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.verticalTitle} numberOfLines={2}>
          {trial.protocolSection?.identificationModule?.briefTitle ||
            'Untitled Trial'}
        </Text>

        <View style={styles.verticalRow}>
          <View style={styles.verticalLocationContainer}>
            <Text style={styles.verticalLocationIcon}>📍</Text>
            <Text style={styles.verticalLocationText} numberOfLines={1}>
              {locationText}
            </Text>
          </View>

          <View style={styles.verticalStatusBadge}>
            <View style={styles.verticalStatusDot} />
            <Text style={styles.verticalStatusText}>RECRUITING</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <LoadingAnimation />
        <Text style={styles.loadingText}>Loading all trials...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayCondition = condition
    ? condition.charAt(0).toUpperCase() + condition.slice(1)
    : '';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          All Clinical Trials for {displayCondition}
        </Text>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {trials.length === 0 ? (
          <View style={styles.emptyContainer}>
            <AntDesign name="search" size={48} color="#888" />
            <Text style={styles.emptyTitle}>No trials found</Text>
            <Text style={styles.emptyText}>
              No clinical trials available for {displayCondition}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                {/* <Text style={styles.sectionTitle}>
                  All Clinical Trials for {displayCondition}
                </Text> */}
                {/* Count inside green pill */}
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>
                    {trials.length} trials found
                  </Text>
                </View>
              </View>

              {trials.map((trial, index) => (
                <VerticalTrialCard key={index} trial={trial} index={index} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 20 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 60,
  },
  loadingText: { marginTop: 10, color: '#666', fontSize: 14 },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: { color: '#fff', fontWeight: 'bold' },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  headerTitle: { fontSize: 25, fontWeight: '700', color: Colors.primary },
  section: { marginBottom: 28, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  countPill: {
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  verticalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 0.3,
  },
  verticalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 22,
    marginBottom: 12,
  },
  verticalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 5,
  },
  verticalLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  verticalLocationIcon: { fontSize: 14, marginRight: 6 },
  verticalLocationText: { fontSize: 13, color: '#666', flexShrink: 1 },
  verticalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  verticalStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 6,
  },
  verticalStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});
