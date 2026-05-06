import { Colors } from '@/constants/colors';
import { Study } from '@/logic/api';
import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

type Props = {
  sliderItem: Study;
  index: number;
  scrollX: SharedValue<number>;
  onPress?: (trial: Study) => void; // ← Add onPress prop
};

const { width } = Dimensions.get('screen');

const SliderItem = ({ sliderItem, index, scrollX, onPress }: Props) => {
  // Get location info
  const location =
    sliderItem.protocolSection?.contactsLocationsModule?.locations?.[0];
  const city = location?.city || '';
  const country = location?.country || '';
  const locationText =
    city && country
      ? `${city}, ${country}`
      : city || country || 'Location not specified';

  // Animated styles for the card
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.85, 1, 0.85],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.9, 1, 0.9],
      Extrapolation.CLAMP,
    );

    const rotateY = interpolate(
      scrollX.value,
      inputRange,
      [15, 0, -15],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ scale }, { rotateY: `${rotateY}deg` }],
      opacity,
    };
  });

  const handlePress = () => {
    if (onPress) {
      onPress(sliderItem);
    }
  };

  return (
    <TouchableOpacity
      style={styles.itemWrapper}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        {/* Status Badge */}
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>RECRUITING</Text>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {sliderItem.protocolSection?.identificationModule?.briefTitle ||
            'Untitled Trial'}
        </Text>

        {/* Location */}
        <View style={styles.locationContainer}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {locationText}
          </Text>
        </View>

        {/* Study ID */}
        {sliderItem.protocolSection?.identificationModule?.nctId && (
          <Text style={styles.studyId}>
            {sliderItem.protocolSection.identificationModule.nctId}
          </Text>
        )}

        {/* Decorative line */}
        <View style={styles.decorativeLine} />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default SliderItem;

const styles = StyleSheet.create({
  itemWrapper: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: width - 32,
    backgroundColor: Colors.primary,
    borderRadius: 24,
    padding: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 24,
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 6,
    color: '#fff',
  },
  locationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    flex: 1,
  },
  studyId: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  decorativeLine: {
    height: 3,
    width: 40,
    backgroundColor: '#fff',
    borderRadius: 2,
    marginTop: 8,
    opacity: 0.5,
  },
});
