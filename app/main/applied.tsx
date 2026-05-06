// app/main/applied.tsx
import LoadingAnimation from '@/components/LoadingAnimation';
import { Colors } from '@/constants/colors';
import { getUserBookmarks, removeBookmark } from '@/services/bookmarkService';
import { FontAwesome } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
} from 'react-native-gesture-handler';
import {
  cacheSavedTrials,
  getCachedSavedTrials,
} from '../../services/cacheServices';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.3;

export default function AppliedScreen() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);

  // Initial load - shows cached data instantly
  useEffect(() => {
    loadBookmarks();
  }, []);

  // Refresh in background when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Applied screen focused - background refresh');
      const user = auth().currentUser;
      if (user && !isBackgroundRefreshing) {
        // Don't show loading spinner, just update in background
        refreshBookmarksInBackground(user.uid);
      }
      return () => {
        // Cleanup if needed
      };
    }, []),
  );

  const loadBookmarks = async () => {
    try {
      const user = auth().currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      // Step 1: Show cached data instantly
      const cachedBookmarks = await getCachedSavedTrials();
      if (cachedBookmarks && cachedBookmarks.length > 0) {
        setBookmarks(cachedBookmarks);
        console.log('📦 Saved trials loaded from cache (instant)');
        setLoading(false);

        // Step 2: Refresh in background without showing loading
        refreshBookmarksInBackground(user.uid);
        return;
      }

      // No cache, must load from Firestore (shows loading spinner)
      setLoading(true);
      const userBookmarks = await getUserBookmarks(user.uid);
      setBookmarks(userBookmarks);
      await cacheSavedTrials(userBookmarks);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshBookmarksInBackground = async (userId: string) => {
    // Prevent multiple simultaneous background refreshes
    if (isBackgroundRefreshing) return;

    setIsBackgroundRefreshing(true);
    try {
      const freshBookmarks = await getUserBookmarks(userId);

      // Only update if data actually changed
      if (JSON.stringify(freshBookmarks) !== JSON.stringify(bookmarks)) {
        setBookmarks(freshBookmarks);
        await cacheSavedTrials(freshBookmarks);
        console.log('📦 Bookmarks cache updated from Firestore (background)');
      } else {
        console.log('📦 No changes detected, cache is up to date');
      }
    } catch (error) {
      console.error('Error refreshing bookmarks in background:', error);
    } finally {
      setIsBackgroundRefreshing(false);
    }
  };

  const handleRemoveBookmark = async (trialId: string) => {
    try {
      const user = auth().currentUser;
      if (!user) return;

      await removeBookmark(user.uid, trialId);
      const updatedBookmarks = bookmarks.filter((b) => b.trialId !== trialId);
      setBookmarks(updatedBookmarks);
      await cacheSavedTrials(updatedBookmarks);
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  const handleTrialPress = (bookmark: any) => {
    router.push({
      pathname: '/trialDetail',
      params: { trialId: bookmark.trialId },
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const user = auth().currentUser;
    if (user) {
      try {
        const freshBookmarks = await getUserBookmarks(user.uid);
        setBookmarks(freshBookmarks);
        await cacheSavedTrials(freshBookmarks);
      } catch (error) {
        console.error('Error refreshing:', error);
      }
    }
    setRefreshing(false);
  }, []);

  // Swipeable card component
  const SwipeableCard = ({
    bookmark,
    onRemove,
  }: {
    bookmark: any;
    onRemove: (id: string) => void;
  }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const [itemHeight, setItemHeight] = useState(0);

    const onGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: translateX } }],
      { useNativeDriver: true },
    );

    const onHandlerStateChange = (event: any) => {
      if (event.nativeEvent.state === State.END) {
        const { translationX } = event.nativeEvent;
        if (translationX < SWIPE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onRemove(bookmark.trialId);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 7,
          }).start();
        }
      }
    };

    return (
      <View
        style={styles.swipeableContainer}
        onLayout={(e) => setItemHeight(e.nativeEvent.layout.height)}
      >
        <View style={[styles.deleteBackground, { height: itemHeight }]}>
          <FontAwesome name="trash-o" size={24} color="#fff" />
          <Text style={styles.deleteText}>Delete</Text>
        </View>

        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-10, 10]}
        >
          <Animated.View
            style={[
              styles.bookmarkCard,
              {
                transform: [{ translateX }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.cardContent}
              onPress={() => handleTrialPress(bookmark)}
              activeOpacity={0.7}
            >
              <Text style={styles.bookmarkTitle} numberOfLines={2}>
                {bookmark.title}
              </Text>
              <View style={styles.bookmarkRow}>
                <View style={styles.locationContainer}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <Text style={styles.locationText} numberOfLines={1}>
                    {bookmark.location}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>RECRUITING</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <LoadingAnimation />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Saved Trials</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{bookmarks.length} Saved</Text>
          </View>
        </View>
        <View style={styles.headerIconContainer}>
          <FontAwesome name="bookmark" size={20} color={Colors.primary} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {bookmarks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <FontAwesome name="bookmark-o" size={64} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>No saved trials yet</Text>
            <Text style={styles.emptyText}>
              Tap the bookmark icon on any trial to save it here for later
            </Text>
          </View>
        ) : (
          bookmarks.map((bookmark) => (
            <SwipeableCard
              key={bookmark.id}
              bookmark={bookmark}
              onRemove={handleRemoveBookmark}
            />
          ))
        )}
      </ScrollView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  headerBadge: {
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  swipeableContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 200,
    backgroundColor: '#d23333',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  deleteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bookmarkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 0.5,
    zIndex: 1,
  },
  cardContent: {
    flex: 1,
  },
  bookmarkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 22,
    marginBottom: 12,
  },
  bookmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    flexShrink: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 0.3,
  },
});
