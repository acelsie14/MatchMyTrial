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
    const inMainGroup = segments[0] === 'main';

    if (!user && !inAuthGroup) {
      // Not logged in and not in auth group - go to login
      console.log('Redirecting to login');
      router.replace('/auth/login');
    } else if (user && !inMainGroup && segments[0] !== 'index') {
      // Logged in but not in main group - go to home
      console.log('Redirecting to home');
      router.replace('/main/home');
    }
  }, [initializing, user, segments]);

  return (
    <Stack>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="main" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
