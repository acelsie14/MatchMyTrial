import auth from '@react-native-firebase/auth';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import { getUser, removeUser } from '../services/authStorage';
import { hasCompletedProfile } from '../services/firestoreService';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const checkAuthState = async () => {
      const cachedUser = await getUser();
      const firebaseUser = auth().currentUser;

      if (!firebaseUser && cachedUser) {
        console.log('Cache out of sync - clearing');
        await removeUser();
      }

      if (firebaseUser) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        try {
          const hasProfile = await hasCompletedProfile(firebaseUser.uid);

          if (hasProfile) {
            router.replace('/main/home');
          } else {
            router.replace('/profileSetup');
          }
        } catch (error) {
          console.log('Firestore not ready, showing profile setup');
          router.replace('/profileSetup');
        }
      } else {
        router.replace('/auth/login');
      }

      setIsLoading(false);
    };

    checkAuthState();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
            alignItems: 'center',
          }}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/MatchMyTrialLogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Animated.View
            style={{ opacity: textFadeAnim, alignItems: 'center' }}
          >
            <Text style={styles.appName}>MatchMyTrial</Text>
            <Text style={styles.tagline}>
              Finding your perfect clinical trial match
            </Text>
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

  return null;
}

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6BBF73',
  } as const,
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 1,
  } as const,
  logo: {
    width: 100,
    height: 100,
  } as const,
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: 0.5,
  } as const,
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  } as const,
};
