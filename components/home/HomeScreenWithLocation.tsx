// components/home/HomeScreenWithLocation.tsx
import { Colors } from '@/constants/colors';
import { AntDesign } from '@expo/vector-icons';
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
  // Professional vertical trial card component (same as HomeScreenWithoutLocation)
  const VerticalTrialCard = ({ trial }: { trial: Study }) => {
    // Get location info
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
        onPress={() => onTrialPress(trial)}
        activeOpacity={0.7}
      >
        {/* Title - max 2 lines */}
        <Text style={styles.verticalTitle} numberOfLines={2}>
          {trial.protocolSection?.identificationModule?.briefTitle ||
            'Untitled Trial'}
        </Text>

        {/* Row with Location and Status */}
        <View style={styles.verticalRow}>
          {/* Location with icon */}
          {/* <View style={styles.verticalLocationContainer}>
            <Text style={styles.verticalLocationIcon}>📍</Text>
            <Text style={styles.verticalLocationText} numberOfLines={1}>
              {locationText}
            </Text>
          </View> */}

          {/* Status badge */}
          <View style={styles.verticalStatusBadge}>
            <View style={styles.verticalStatusDot} />
            <Text style={styles.verticalStatusText}>RECRUITING</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Searching for trials...</Text>
      </View>
    );
  }

  // Format location for display (capitalize first letter of each word)
  const displayLocation = locationSearch
    .split(',')
    .map((part) => part.trim().charAt(0).toUpperCase() + part.trim().slice(1))
    .join(', ');

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Matches in {displayLocation}</Text>
          {/* <Text style={styles.sectionSubtitle}>
            {locationMatches.length} trials found
          </Text> */}
        </View>

        {locationMatches.length > 0 ? (
          locationMatches.map((trial, index) => (
            <VerticalTrialCard key={index} trial={trial} />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <AntDesign name="search" size={48} color="#888" />
            <Text style={styles.emptyTitle}>
              No trials found in {displayLocation}
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
  scrollContent: {
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  section: {
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    paddingTop: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  // Vertical Card Styles (same as HomeScreenWithoutLocation)
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
  verticalLocationIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  verticalLocationText: {
    fontSize: 13,
    color: '#666',
    flexShrink: 1,
  },
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
  // Empty state styles
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
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
  clearSearchButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearSearchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
