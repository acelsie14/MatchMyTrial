// services/authService.ts
import auth from '@react-native-firebase/auth';
import { router } from 'expo-router';
import { removeUser } from './authStorage';

export const logout = async () => {
  try {
    // Clear AsyncStorage first
    await removeUser();
    // Sign out from Firebase
    await auth().signOut();
    // Redirect to login
    router.replace('/auth/login');
  } catch (error) {
    console.error('Logout error:', error);
  }
};
