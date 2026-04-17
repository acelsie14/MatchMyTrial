import { AntDesign } from '@expo/vector-icons';
import React, { useState } from 'react';
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
}

export default function HomeScreenWithoutLocation({
  topMatches,
  allTrials,
  isLoading,
  onTrialPress,
}: HomeScreenWithoutLocationProps) {
  const [data, setData] = useState(topMatches);
  const [paginationIndex, setPaginationIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const ref = useAnimatedRef<Animated.FlatList<any>>();

  const onScrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const renderTrialCard = (
    trial: Study,
    index: number,
    isHorizontal: boolean = false,
  ) => (
    <TouchableOpacity
      key={index}
      style={[styles.trialCard, isHorizontal && styles.horizontalCard]}
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
          {trial.protocolSection.contactsLocationsModule.locations[0].city},
          {trial.protocolSection.contactsLocationsModule.locations[0].country}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6BBF73" />
        <Text style={styles.loadingText}>Loading trials...</Text>
      </View>
    );
  }

  const hasNoTrials = topMatches.length === 0 && allTrials.length === 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {hasNoTrials ? (
        <View style={styles.emptyContainer}>
          <AntDesign
            name="search"
            size={48}
            color="#888"
            style={styles.emptyEmoji}
          />
          <Text style={styles.emptyTitle}>No trials found</Text>
          <Text style={styles.emptyText}>
            Try searching for a different condition or location
          </Text>
        </View>
      ) : (
        <>
          {/* Top Matches Section - Horizontal */}
          {topMatches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top Matches</Text>
                <Text style={styles.sectionSubtitle}>
                  Most relevant for you
                </Text>
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

          {/* All Trials Section - Vertical */}
          {allTrials.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>All Clinical Trials</Text>
                <Text style={styles.sectionSubtitle}>Recently updated</Text>
              </View>
              {allTrials.map((trial, index) =>
                renderTrialCard(trial, index, false),
              )}
            </View>
          )}
        </>
      )}
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
  horizontalList: {
    paddingRight: 16,
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
    elevation: 1,
  },
  horizontalCard: {
    width: 280,
    marginRight: 12,
    marginBottom: 0,
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
    paddingHorizontal: 16,
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
});
