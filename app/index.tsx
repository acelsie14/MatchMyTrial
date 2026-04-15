// app/index.tsx
import auth from '@react-native-firebase/auth';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { getUser, removeUser } from '../services/authStorage';
import { hasCompletedProfile } from '../services/firestoreService';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthState = async () => {
      const cachedUser = await getUser();
      const firebaseUser = auth().currentUser;

      if (!firebaseUser && cachedUser) {
        console.log('Cache out of sync - clearing');
        await removeUser();
      }

      if (firebaseUser) {
        // Add delay to ensure Firestore is ready
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
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
        }}
      >
        <ActivityIndicator size="large" color="#6BBF73" />
      </View>
    );
  }

  return null;
}
