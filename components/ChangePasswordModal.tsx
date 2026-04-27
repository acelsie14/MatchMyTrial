import { Colors } from '@/constants/colors';
import { AntDesign } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({
  visible,
  onClose,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    const user = auth().currentUser;
    if (!user || !user.email) {
      Alert.alert('Error', 'User not found. Please log out and log back in.');
      return;
    }

    // Validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert(
        'Error',
        'New password must be different from current password',
      );
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate user with current password
      const credential = auth.EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await user.reauthenticateWithCredential(credential);

      // Update password
      await user.updatePassword(newPassword);

      Alert.alert(
        'Success',
        'Password changed successfully. Please use your new password next time you log in.',
      );

      // Clear form and close
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      onClose();
    } catch (error: any) {
      console.error('Error changing password:', error);

      // Handle specific error codes
      switch (error.code) {
        case 'auth/wrong-password':
          Alert.alert(
            'Error',
            'Current password is incorrect. Please try again.',
          );
          break;
        case 'auth/invalid-credential':
          Alert.alert(
            'Error',
            'Current password is incorrect. Please try again.',
          );
          break;
        case 'auth/requires-recent-login':
          Alert.alert(
            'Session Expired',
            'For security reasons, please log out and log back in before changing your password.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Log Out',
                onPress: async () => {
                  await auth().signOut();
                  // You may want to navigate to login screen here
                },
              },
            ],
          );
          break;
        case 'auth/too-many-requests':
          Alert.alert(
            'Too Many Attempts',
            'Please try again later after some time.',
          );
          break;
        default:
          Alert.alert('Error', 'Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Current Password */}
            <Text style={styles.modalLabel}>Current Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter your current password"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeButton}
              >
                <AntDesign
                  name={showCurrentPassword ? 'eye' : 'eye-invisible'}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            {/* New Password */}
            <Text style={styles.modalLabel}>New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password (min 6 characters)"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
              >
                <AntDesign
                  name={showNewPassword ? 'eye' : 'eye-invisible'}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.passwordHint}>Minimum 6 characters</Text>

            {/* Confirm New Password */}
            <Text style={styles.modalLabel}>Confirm New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry={!showConfirmPassword}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                placeholder="Confirm your new password"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <AntDesign
                  name={showConfirmPassword ? 'eye' : 'eye-invisible'}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalButtonText}>Change Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalClose: {
    fontSize: 20,
    color: '#666',
    fontWeight: '600',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 15,
    color: '#1a1a1a',
  },
  eyeButton: {
    padding: 12,
  },
  passwordHint: {
    fontSize: 11,
    color: '#888',
    marginBottom: 16,
    marginLeft: 4,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
