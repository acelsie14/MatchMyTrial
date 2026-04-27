import { Colors } from '@/constants/colors';
import { AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { Study } from '../../logic/api';
import SliderItem from '../SliderItem';

const { width } = Dimensions.get('screen');

interface HomeScreenWithoutLocationProps {
  topMatches: Study[];
  allTrials: Study[];
  isLoading: boolean;
  onTrialPress: (trial: Study) => void;
  userCondition: string;
  userProfile?: any;
}

export default function HomeScreenWithoutLocation({
  topMatches,
  allTrials,
  isLoading,
  onTrialPress,
  userCondition,
  userProfile,
}: HomeScreenWithoutLocationProps) {
  const scrollX = useSharedValue(0);
  const ref = useAnimatedRef<Animated.FlatList<any>>();

  const onScrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const VerticalTrialCard = ({ trial }: { trial: Study }) => {
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

  const handleSeeMore = () => {
    if (userProfile) {
      router.push({
        pathname: '/allTrials',
        params: {
          condition: userProfile.condition,
          age: userProfile.age.toString(),
          gender: userProfile.gender,
        },
      });
    }
  };

  if (isLoading && allTrials.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading trials...</Text>
      </View>
    );
  }

  const hasNoTrials = topMatches.length === 0 && allTrials.length === 0;

  const displayCondition = userCondition
    ? userCondition.charAt(0).toUpperCase() + userCondition.slice(1)
    : '';

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {hasNoTrials ? (
        <View style={styles.emptyContainer}>
          <AntDesign name="search" size={48} color="#888" />
          <Text style={styles.emptyTitle}>No trials found</Text>
          <Text style={styles.emptyText}>
            Try searching for a different condition or location
          </Text>
        </View>
      ) : (
        <>
          {/* Top Matches Section */}
          {topMatches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top Matches</Text>
              </View>
              <Animated.FlatList
                ref={ref}
                data={topMatches}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                decelerationRate="fast"
                snapToInterval={width}
                snapToAlignment="center"
                keyExtractor={(_, index) => `top-${index}`}
                renderItem={({ item, index }) => (
                  <SliderItem
                    sliderItem={item}
                    index={index}
                    scrollX={scrollX}
                  />
                )}
                onScroll={onScrollHandler}
                scrollEventThrottle={16}
              />
            </View>
          )}

          {/* All Trials Section */}
          {allTrials.length > 0 && (
            <View style={styles.section}>
              {/* Header with Title and See More link on the same row */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  All Clinical Trials for {displayCondition}
                </Text>
                <TouchableOpacity onPress={handleSeeMore}>
                  <Text style={styles.seeMoreLink}>See More</Text>
                </TouchableOpacity>
              </View>

              {allTrials.map((trial, index) => (
                <VerticalTrialCard key={index} trial={trial} />
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
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
  section: { marginBottom: 28, paddingHorizontal: 16 },
  sectionHeader: { marginBottom: 16 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  seeMoreLink: {
    fontSize: 14,
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
});
