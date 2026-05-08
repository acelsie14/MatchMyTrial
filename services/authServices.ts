// services/authServices.ts
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

// Re-authenticate user with their password
export const reauthenticateUser = async (
  password: string,
): Promise<boolean> => {
  try {
    const user = auth().currentUser;
    if (!user || !user.email) {
      throw new Error('No user logged in');
    }

    // Create credential with email and password
    const credential = auth.EmailAuthProvider.credential(user.email, password);

    // Re-authenticate the user
    await user.reauthenticateWithCredential(credential);
    console.log('✅ User re-authenticated successfully');
    return true;
  } catch (error: any) {
    console.error('Re-authentication failed:', error);
    if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password. Please try again.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Please try again later.');
    } else if (error.code === 'auth/user-not-found') {
      throw new Error('User not found. Please log in again.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('Authentication failed. Please try again.');
    }
  }
};
