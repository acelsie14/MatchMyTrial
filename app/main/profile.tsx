import { Colors } from '@/constants/colors';
import { logout } from '@/services/authServices';
import { getUserProfile, saveUserProfile } from '@/services/firestoreService';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import {
  cacheUserProfile,
  clearCache,
  getCachedUserProfile,
} from '../../services/cacheServices';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [condition, setCondition] = useState('');

  const [originalUsername, setOriginalUsername] = useState('');
  const [originalGender, setOriginalGender] = useState('');
  const [originalCondition, setOriginalCondition] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = auth().currentUser;
      if (!user) {
        router.replace('/auth/login');
        return;
      }

      setUsername(user.displayName || '');
      setEmail(user.email || '');
      setOriginalUsername(user.displayName || '');

      const cachedProfile = await getCachedUserProfile();
      if (cachedProfile) {
        setAge(cachedProfile.age?.toString() || '');
        setGender(cachedProfile.gender || '');
        setCondition(cachedProfile.condition || '');

        setOriginalGender(cachedProfile.gender || '');
        setOriginalCondition(cachedProfile.condition || '');

        console.log('📦 Profile loaded from cache');
        fetchAndUpdateProfile(user.uid);
        return;
      }

      const profile = await getUserProfile(user.uid);
      if (profile) {
        setAge(profile.age?.toString() || '');
        setGender(profile.gender || '');
        setCondition(profile.condition || '');

        setOriginalGender(profile.gender || '');
        setOriginalCondition(profile.condition || '');

        await cacheUserProfile({
          condition: profile.condition,
          age: profile.age,
          gender: profile.gender as 'male' | 'female',
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAndUpdateProfile = async (userId: string) => {
    try {
      const profile = await getUserProfile(userId);
      if (profile) {
        const patientProfile = {
          condition: profile.condition,
          age: profile.age,
          gender: profile.gender as 'male' | 'female',
        };
        setAge(profile.age?.toString() || '');
        setGender(profile.gender || '');
        setCondition(profile.condition || '');

        await cacheUserProfile(patientProfile);
        console.log('📦 Profile cache updated from Firestore');
      }
    } catch (error) {
      console.error('Error updating profile from Firestore:', error);
    }
  };

  const handleEdit = () => {
    setOriginalUsername(username);
    setOriginalGender(gender);
    setOriginalCondition(condition);
    setIsEditing(true);
    setShowMoreMenu(false);
  };

  const handleCancel = () => {
    setUsername(originalUsername);
    setGender(originalGender);
    setCondition(originalCondition);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const user = auth().currentUser;
    if (!user) return;

    setSaving(true);
    try {
      if (username !== originalUsername) {
        await user.updateProfile({ displayName: username });
        const { saveUser } = require('@/services/authStorage');
        await saveUser({
          uid: user.uid,
          email: email,
          username: username,
        });
      }

      const profileData = {
        age: parseInt(age, 10) || 0,
        gender: gender.toLowerCase(),
        condition: condition,
      };

      await saveUserProfile(user.uid, profileData);
      await cacheUserProfile({
        condition: profileData.condition,
        age: profileData.age,
        gender: profileData.gender as 'male' | 'female',
      });

      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth().currentUser;
    if (!user) return;

    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is permanent and cannot be undone. All your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const userId = user.uid;

              // 1. Delete user profile document from Firestore (users collection)
              await firestore().collection('users').doc(userId).delete();
              console.log('✅ User profile deleted from users collection');

              // 2. Delete all bookmarks in the nested structure
              // First, get all bookmarks in the user's bookmarks subcollection
              const bookmarksSnapshot = await firestore()
                .collection('savedTrials')
                .doc(userId)
                .collection('bookmarks')
                .get();

              // Delete each bookmark document
              const bookmarkBatch = firestore().batch();
              bookmarksSnapshot.forEach((doc) => {
                bookmarkBatch.delete(doc.ref);
              });
              await bookmarkBatch.commit();
              console.log(
                `✅ Deleted ${bookmarksSnapshot.size} bookmarks from savedTrials/${userId}/bookmarks`,
              );

              // 3. Delete the user's document in savedTrials collection
              await firestore().collection('savedTrials').doc(userId).delete();
              console.log('✅ User savedTrials document deleted');

              // 4. Clear local storage (AsyncStorage)
              const { removeUser } = require('@/services/authStorage');
              await removeUser();
              await clearCache();
              console.log('✅ Local cache cleared');

              // 5. Delete the user from Firebase Authentication
              await user.delete();
              console.log('✅ Firebase Auth user deleted');

              // 6. Show success alert and navigate to login
              Alert.alert(
                'Account Deleted',
                'Your account has been successfully deleted. All your data has been removed.',
                [{ text: 'OK', onPress: () => router.replace('/auth/login') }],
              );
            } catch (error: any) {
              console.error('Error deleting account:', error);
              setLoading(false);

              if (error.code === 'auth/requires-recent-login') {
                Alert.alert(
                  'Authentication Required',
                  'For security reasons, please log out and log back in before deleting your account.',
                  [
                    {
                      text: 'OK',
                      onPress: async () => {
                        await logout();
                        router.replace('/auth/login');
                      },
                    },
                  ],
                );
              } else if (error.code === 'auth/network-request-failed') {
                Alert.alert(
                  'Network Error',
                  'Please check your internet connection and try again.',
                );
              } else {
                Alert.alert(
                  'Error',
                  `Failed to delete account: ${error.message || 'Please try again.'}`,
                );
              }
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const closeAllMenus = () => {
    setShowMoreMenu(false);
  };

  const MoreMenu = () => (
    <View style={styles.menuContainer}>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setShowMoreMenu(false);
          setShowPasswordModal(true);
        }}
      >
        <Text style={styles.menuItemText}>Change Password</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.menuItem, styles.menuItemDestructive]}
        onPress={() => {
          setShowMoreMenu(false);
          handleDeleteAccount();
        }}
      >
        <Text style={styles.menuItemDestructiveText}>Delete Account</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.menuItem, styles.menuItemLast]}
        onPress={() => {
          setShowMoreMenu(false);
          handleLogout();
        }}
      >
        <Text style={styles.menuItemLogoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={closeAllMenus}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <StatusBar style="dark" />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerButtons}>
            {!isEditing ? (
              <TouchableOpacity
                onPress={handleEdit}
                style={styles.headerButton}
              >
                <Text style={styles.headerButtonText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  onPress={handleCancel}
                  style={styles.headerButton}
                >
                  <Text style={styles.headerButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  style={styles.headerButton}
                  disabled={saving}
                >
                  <Text style={styles.headerButtonText}>
                    {saving ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              onPress={() => setShowMoreMenu(!showMoreMenu)}
              style={styles.headerButton}
            >
              <Text style={styles.headerButtonText}>⋯</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showMoreMenu && (
          <View style={styles.menuWrapper}>
            <MoreMenu />
          </View>
        )}

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            isEditing && styles.scrollContentEditing,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {username ? username.charAt(0).toUpperCase() : '👤'}
              </Text>
            </View>
            <Text style={styles.profileName}>{username || 'User'}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Text style={styles.infoIconText}>👤</Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Username</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={username}
                      onChangeText={setUsername}
                      placeholder="Enter username"
                      placeholderTextColor="#999"
                    />
                  ) : (
                    <Text style={styles.infoValue}>
                      {username || 'Not set'}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Text style={styles.infoIconText}>📧</Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{email}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Text style={styles.infoIconText}>🎂</Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Age</Text>
                  <Text style={styles.infoValue}>{age || 'Not set'}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Text style={styles.infoIconText}>⚥</Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Gender</Text>
                  {isEditing ? (
                    <View style={styles.genderContainer}>
                      <TouchableOpacity
                        style={[
                          styles.genderOption,
                          gender === 'male' && styles.genderOptionSelected,
                        ]}
                        onPress={() => setGender('male')}
                      >
                        <Text
                          style={[
                            styles.genderOptionText,
                            gender === 'male' &&
                              styles.genderOptionTextSelected,
                          ]}
                        >
                          Male
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.genderOption,
                          gender === 'female' && styles.genderOptionSelected,
                        ]}
                        onPress={() => setGender('female')}
                      >
                        <Text
                          style={[
                            styles.genderOptionText,
                            gender === 'female' &&
                              styles.genderOptionTextSelected,
                          ]}
                        >
                          Female
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.infoValue}>
                      {gender
                        ? gender.charAt(0).toUpperCase() + gender.slice(1)
                        : 'Not set'}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Text style={styles.infoIconText}>🏥</Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Medical Condition</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={condition}
                      onChangeText={setCondition}
                      placeholder="e.g., Diabetes, Cancer, Asthma"
                      placeholderTextColor="#999"
                    />
                  ) : (
                    <Text style={styles.infoValue}>
                      {condition || 'Not set'}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <ChangePasswordModal
          visible={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
        />
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  menuWrapper: {
    position: 'absolute',
    top: 100,
    right: 20,
    zIndex: 1000,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    minWidth: 180,
  },
  menuItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemDestructive: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  menuItemDestructiveText: {
    fontSize: 15,
    color: '#DC2626',
  },
  menuItemLogoutText: {
    fontSize: 15,
    color: '#DC2626',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  scrollContentEditing: {
    paddingBottom: 120,
  },
  profileCard: {
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
    borderRadius: 24,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: '600',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoIconText: {
    fontSize: 18,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 54,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#F9FAFB',
    color: '#1a1a1a',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
  },
  genderOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderOptionText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 14,
  },
  genderOptionTextSelected: {
    color: '#fff',
  },
  bottomSpacer: {
    height: 100,
  },
});
