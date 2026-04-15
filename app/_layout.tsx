import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((authUser) => {
      console.log('Auth state changed:', authUser?.email);
      setUser(authUser);
      if (initializing) setInitializing(false);
    });
    return subscriber;
  }, [initializing]);

  useEffect(() => {
    if (initializing) return;

    console.log('Current segments:', segments);
    console.log('User exists:', !!user);

    const inAuthGroup = segments[0] === 'auth';

    // Only handle auth redirects here
    // Profile and main redirects are handled by index.tsx
    if (!user && !inAuthGroup && segments[0] !== 'index') {
      console.log('Redirecting to login');
      router.replace('/auth/login');
    }
    // If user is logged in, let index.tsx decide (profile-setup vs main)
    // Don't auto-redirect here
  }, [initializing, user, segments]);

  return (
    <Stack>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="main" options={{ headerShown: false }} />
      <Stack.Screen name="profileSetup" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
