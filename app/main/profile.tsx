import { Colors } from '@/constants/colors';
import { logout } from '@/services/authServices';
import { getUserProfile, saveUserProfile } from '@/services/firestoreService';
import auth from '@react-native-firebase/auth';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [condition, setCondition] = useState('');

  const [originalAge, setOriginalAge] = useState('');
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

      const profile = await getUserProfile(user.uid);
      if (profile) {
        setAge(profile.age?.toString() || '');
        setGender(profile.gender || '');
        setCondition(profile.condition || '');

        setOriginalAge(profile.age?.toString() || '');
        setOriginalGender(profile.gender || '');
        setOriginalCondition(profile.condition || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setOriginalAge(age);
    setOriginalGender(gender);
    setOriginalCondition(condition);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setAge(originalAge);
    setGender(originalGender);
    setCondition(originalCondition);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const user = auth().currentUser;
    if (!user) return;

    setSaving(true);
    try {
      await saveUserProfile(user.uid, {
        age: parseInt(age, 10) || 0,
        gender: gender.toLowerCase(),
        condition: condition,
      });

      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
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

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'This feature will be available soon. For now, you can reset your password using "Forgot Password" on the login screen.',
      [{ text: 'OK' }],
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        {!isEditing ? (
          <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveButton}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {username ? username.charAt(0).toUpperCase() : '👤'}
            </Text>
          </View>
          <Text style={styles.profileName}>{username || 'User'}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoIconText}>👤</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoValue}>{username || 'Not set'}</Text>
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
          </View>
        </View>

        {/* Medical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoIconText}>🎂</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Age</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="number-pad"
                    placeholder="Enter your age"
                    placeholderTextColor="#999"
                  />
                ) : (
                  <Text style={styles.infoValue}>{age || 'Not set'}</Text>
                )}
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
                          gender === 'male' && styles.genderOptionTextSelected,
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
                  <Text style={styles.infoValue}>{condition || 'Not set'}</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Account Actions - Moved inside ScrollView with extra bottom padding */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={handleChangePassword}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.actionButton, styles.logoutButton]}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Extra spacer to ensure content clears the tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
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
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 0,
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
  actionsContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 0,
  },
  actionButton: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 16,
    marginBottom: 12,
  },
  actionButtonText: {
    color: Colors.primary,
    fontWeight: '500',
    fontSize: 15,
  },
  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    marginBottom: 50,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontWeight: '500',
    fontSize: 15,
  },
  bottomSpacer: {
    height: 80, // Extra space to clear the tab bar
  },
});
