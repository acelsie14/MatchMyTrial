// app/index.tsx
import auth from '@react-native-firebase/auth';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { getUser, removeUser } from '../services/authStorage';

export default function Index() {
  useEffect(() => {
    const checkAuthState = async () => {
      // Step 1: Check AsyncStorage cache first (instant)
      const cachedUser = await getUser();

      // Step 2: Check Firebase current user
      const firebaseUser = auth().currentUser;

      // Step 3: If Firebase has no user but cache exists, clear the bad cache
      if (!firebaseUser && cachedUser) {
        console.log('Cache out of sync - clearing');
        await removeUser();
      }

      // Step 4: Redirect based on actual auth state
      if (firebaseUser) {
        // User is logged into Firebase
        router.replace('/main/home');
      } else {
        // No user logged in
        router.replace('/auth/login');
      }
    };

    checkAuthState();
  }, []);

  // Return null - no UI needed during redirect
  return null;
}
