// app/auth/login.tsx
import { Colors } from '@/constants/colors';
import { saveUser } from '@/services/authStorage';
import { addVerifiedEmail } from '@/services/firestoreService';
import { AntDesign } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    // Clear previous errors
    setError('');

    // Validation
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await auth().signInWithEmailAndPassword(
        email.trim(),
        password,
      );
      const user = userCredential.user;

      // Check email verification
      if (!user.emailVerified) {
        await auth().signOut();
        setError(
          'Email not verified. Please check your inbox and click the verification link before logging in.',
        );
        setLoading(false);
        return;
      }

      // ✅ NEW: Store this email in verifiedEmails collection (for future returning users)
      if (user.email && user.emailVerified) {
        await addVerifiedEmail(user.email);
      }

      // Save user data
      await saveUser({
        uid: user.uid,
        email: user.email || '',
        username: user.displayName || '',
      });

      router.replace('/');
    } catch (error: any) {
      const errorCode = error.code;

      // Detailed error messages
      switch (errorCode) {
        case 'auth/invalid-email':
          setError(
            'The email address format is invalid. Please enter a valid email (e.g., name@example.com).',
          );
          break;

        case 'auth/user-disabled':
          setError(
            'This account has been disabled. Please contact support for assistance.',
          );
          break;

        case 'auth/user-not-found':
          setError(
            'No account found with this email address. Please check your email or sign up to create a new account.',
          );
          break;

        case 'auth/wrong-password':
          setError(
            'Incorrect password. Please try again or use "Forgot Password" to reset it.',
          );
          break;

        case 'auth/too-many-requests':
          setError(
            'Too many failed login attempts. Please wait a few minutes before trying again, or reset your password.',
          );
          break;

        case 'auth/network-request-failed':
          setError(
            'Network connection failed. Please check your internet connection and try again.',
          );
          break;

        case 'auth/invalid-credential':
          setError(
            'Invalid login credentials. Please check your email and password and try again.',
          );
          break;

        case 'auth/operation-not-allowed':
          setError(
            'Email/password sign-in is not enabled. Please contact support.',
          );
          break;

        default:
          setError('Unable to sign in. Please try again later.');
          console.error('Unhandled login error:', errorCode, error.message);
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      Alert.alert(
        'Email Required',
        'Please enter your email address to resend the verification link.',
      );
      return;
    }

    setResetLoading(true);
    try {
      // First check if account exists
      const signInMethods = await auth().fetchSignInMethodsForEmail(
        email.trim(),
      );

      if (signInMethods.length === 0) {
        Alert.alert(
          'Account Not Found',
          'No account exists with this email address. Please sign up first.',
          [
            { text: 'OK' },
            { text: 'Sign Up', onPress: () => router.replace('/auth/signup') },
          ],
        );
        return;
      }

      // Send verification email
      const actionCodeSettings = {
        url: 'https://matchmytrial.page.link/verify',
        handleCodeInApp: true,
      };

      await auth().sendSignInLinkToEmail(email.trim(), actionCodeSettings);
      Alert.alert(
        'Verification Email Sent',
        `A verification link has been sent to ${email}. Please check your inbox and spam folder.`,
        [{ text: 'OK' }],
      );
    } catch (error: any) {
      console.error('Resend error:', error);
      Alert.alert(
        'Unable to Send',
        'We could not send a verification email. Please ensure you have an account with this email address.',
        [{ text: 'OK' }],
      );
    } finally {
      setResetLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        'Email Required',
        'Please enter your email address to reset your password.',
      );
      return;
    }

    setResetLoading(true);
    try {
      await auth().sendPasswordResetEmail(email.trim());
      Alert.alert(
        'Password Reset Email Sent',
        `We've sent a password reset link to ${email}. Please check your inbox and follow the instructions to reset your password.`,
        [{ text: 'OK' }],
      );
    } catch (error: any) {
      const errorCode = error.code;
      switch (errorCode) {
        case 'auth/invalid-email':
          Alert.alert('Invalid Email', 'Please enter a valid email address.');
          break;
        case 'auth/user-not-found':
          Alert.alert(
            'Account Not Found',
            'No account exists with this email address. Please sign up first.',
            [
              { text: 'OK' },
              {
                text: 'Sign Up',
                onPress: () => router.replace('/auth/signup'),
              },
            ],
          );
          break;
        case 'auth/too-many-requests':
          Alert.alert('Too Many Attempts', 'Please try again later.');
          break;
        default:
          Alert.alert(
            'Error',
            'Failed to send password reset email. Please try again.',
          );
          break;
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.emoji}>🩺</Text>
          </View>
          <Text style={styles.subtitle}>
            Sign in to find your perfect clinical trial match
          </Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="you@example.com"
              value={email}
              onChangeText={(text) => {
                setError('');
                setEmail(text);
              }}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Enter your password"
                value={password}
                onChangeText={(text) => {
                  setError('');
                  setPassword(text);
                }}
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <AntDesign
                  name={showPassword ? 'eye' : 'eye-invisible'}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleForgotPassword}
            disabled={resetLoading}
            style={styles.forgotPasswordContainer}
          >
            {resetLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account?</Text>
          <TouchableOpacity onPress={() => router.replace('/auth/signup')}>
            <Text style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resendContainer}>
          <TouchableOpacity
            onPress={handleResendVerification}
            disabled={resetLoading}
          >
            <Text style={styles.resendText}>
              Didn&apos;t receive verification email?
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
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
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#1a1a1a',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#1a1a1a',
  },
  eyeButton: {
    padding: 14,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: Colors.primaryLight,
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  linkText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  resendText: {
    fontSize: 13,
    color: '#888',
  },
});
