// components/home/HomeScreenWithLocation.tsx
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Study } from '../../logic/api';

interface HomeScreenWithLocationProps {
  locationSearch: string;
  locationMatches: Study[];
  isLoading: boolean;
  onClearSearch: () => void;
  onTrialPress: (trial: Study) => void;
}

export default function HomeScreenWithLocation({
  locationSearch,
  locationMatches,
  isLoading,
  onClearSearch,
  onTrialPress,
}: HomeScreenWithLocationProps) {
  const renderTrialCard = (trial: Study, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.trialCard}
      onPress={() => onTrialPress(trial)}
    >
      <Text style={styles.trialTitle}>
        {trial.protocolSection?.identificationModule?.briefTitle ||
          'Untitled Trial'}
      </Text>
      <Text style={styles.trialStatus}>
        Status:{' '}
        {trial.protocolSection?.statusModule?.overallStatus || 'Unknown'}
      </Text>
      {trial.protocolSection?.contactsLocationsModule?.locations?.[0] && (
        <Text style={styles.trialLocation}>
          📍 {trial.protocolSection.contactsLocationsModule.locations[0].city},
          {trial.protocolSection.contactsLocationsModule.locations[0].country}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6BBF73" />
        <Text style={styles.loadingText}>Searching for trials...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            📍 Matches in {locationSearch}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {locationMatches.length} trials found
          </Text>
        </View>

        {locationMatches.length > 0 ? (
          locationMatches.map((trial, index) => renderTrialCard(trial, index))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>
              No trials found in {locationSearch}
            </Text>
            <Text style={styles.emptyText}>Try a different location</Text>
            <TouchableOpacity
              onPress={onClearSearch}
              style={styles.clearSearchButton}
            >
              <Text style={styles.clearSearchButtonText}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
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
    backgroundColor: '#f5f5f5',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  trialCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  trialTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  trialStatus: {
    fontSize: 13,
    color: '#6BBF73',
    marginBottom: 4,
  },
  trialLocation: {
    fontSize: 12,
    color: '#888',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: 20,
    backgroundColor: '#6BBF73',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearSearchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
