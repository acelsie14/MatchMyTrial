import DropDown from '@/components/DropDown';
import { Colors } from '@/constants/colors';
import { saveUserProfile } from '@/services/firestoreService';
import auth from '@react-native-firebase/auth';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const ProfileSetup = () => {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [condition, setCondition] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!age) {
      setError('Please enter your age');
      return false;
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum)) {
      setError('Please enter your age');
      return false;
    }
    if (!gender) {
      setError('Please select your gender');
      return false;
    }
    if (!condition) {
      setError('Please enter your medical condition');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = auth().currentUser;
      if (!user) {
        setError('User not found. Please log in again.');
        setLoading(false);
        return;
      }

      await saveUserProfile(user.uid, {
        age: parseInt(age, 10),
        gender: gender.toLowerCase(),
        condition: condition,
      });

      // ✅ Navigate to index to re-check profile (will now go to home)
      router.replace('/');
    } catch (err) {
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.title}>Complete Your Profile</Text>
              <Text style={styles.emoji}>🩺</Text>
            </View>
            <Text style={styles.subtitle}>
              Tell us about yourself to find the best clinical trial matches
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Age <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                placeholder="Enter your age"
                value={age}
                onChangeText={(text) => {
                  setError('');
                  setAge(text);
                }}
                keyboardType="number-pad"
                style={styles.input}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Gender <Text style={styles.required}>*</Text>
              </Text>
              <DropDown
                data={[
                  { value: 'Male', label: 'M' },
                  { value: 'Female', label: 'F' },
                ]}
                placeholder="Select Gender"
                onChange={(data) => {
                  setError('');
                  setGender(data.value);
                }}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Medical Condition <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                placeholder="e.g., Diabetes, Hypertension, Cancer"
                value={condition}
                onChangeText={(text) => {
                  setError('');
                  setCondition(text);
                }}
                style={styles.input}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProfileSetup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: Colors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: Colors.textPrimary,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: Colors.primaryLight,
    opacity: 0.8,
  },
  buttonText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
});
