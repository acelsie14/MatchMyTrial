import { Colors } from '@/constants/colors';
import { saveUser } from '@/services/authStorage';
import { AntDesign } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const router = useRouter();

  const validateForm = () => {
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    if (!termsAccepted) {
      setError('Please accept the Terms & Conditions to continue');
      return false;
    }
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );
      const user = userCredential.user;

      await user.updateProfile({
        displayName: username,
      });

      await saveUser({
        uid: user.uid,
        email: user.email || '',
        username: username,
      });

      router.replace('/');
    } catch (error: any) {
      const errorCode = error.code;

      switch (errorCode) {
        case 'auth/invalid-email':
          setError('Please enter a valid email address');
          break;
        case 'auth/email-already-in-use':
          setError(
            'An account already exists with this email. Please login instead.',
          );
          break;
        case 'auth/weak-password':
          setError('Password is too weak. Please use at least 6 characters.');
          break;
        case 'auth/network-request-failed':
          setError('No internet connection. Please check your network.');
          break;
        default:
          setError('Failed to create account. Please try again.');
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const TermsModal = () => (
    <Modal
      visible={showTermsModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowTermsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Terms & Conditions</Text>
            <TouchableOpacity onPress={() => setShowTermsModal(false)}>
              <AntDesign name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.modalText}>
              By creating an account and using MatchMyTrial, you agree to be
              bound by these Terms & Conditions. If you do not agree to these
              terms, please do not use our service.
            </Text>

            <Text style={styles.modalSectionTitle}>
              2. Description of Service
            </Text>
            <Text style={styles.modalText}>
              MatchMyTrial is a clinical trial matchmaking platform that
              connects patients with relevant clinical trials based on their
              medical condition, age, gender, and location preferences. Our
              service provides information about clinical trials but does not
              guarantee acceptance into any trial.
            </Text>

            <Text style={styles.modalSectionTitle}>
              3. User Responsibilities
            </Text>
            <Text style={styles.modalText}>
              You are responsible for providing accurate and complete
              information about your medical condition and personal details. You
              acknowledge that clinical trial participation requires meeting
              specific eligibility criteria set by trial organizers.
            </Text>

            <Text style={styles.modalSectionTitle}>
              4. Privacy & Data Protection
            </Text>
            <Text style={styles.modalText}>
              Your personal and medical information is protected according to
              our Privacy Policy. We do not share your information with third
              parties without your explicit consent, except as required to match
              you with clinical trials.
            </Text>

            <Text style={styles.modalSectionTitle}>
              5. Disclaimer of Warranties
            </Text>
            <Text style={styles.modalText}>
              MatchMyTrial provides clinical trial information for informational
              purposes only. We do not provide medical advice, diagnosis, or
              treatment. Always consult with a qualified healthcare professional
              before participating in any clinical trial.
            </Text>

            <Text style={styles.modalSectionTitle}>
              6. Limitation of Liability
            </Text>
            <Text style={styles.modalText}>
              MatchMyTrial shall not be liable for any damages arising from your
              use of the service, including but not limited to, decisions made
              based on trial information, failure to be accepted into trials, or
              any medical outcomes.
            </Text>

            <Text style={styles.modalSectionTitle}>
              7. Modifications to Service
            </Text>
            <Text style={styles.modalText}>
              We reserve the right to modify or discontinue the service at any
              time without notice. We may also update these Terms & Conditions
              from time to time.
            </Text>

            <Text style={styles.modalSectionTitle}>8. Contact Information</Text>
            <Text style={styles.modalText}>
              For questions about these Terms & Conditions, please contact us
              at: support@matchmytrial.com
            </Text>

            <Text style={styles.modalFooter}>Last Updated: April 2025</Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowTermsModal(false)}
          >
            <Text style={styles.modalButtonText}>I Understand</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const PrivacyModal = () => (
    <Modal
      visible={showPrivacyModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPrivacyModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
              <AntDesign name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSectionTitle}>Information We Collect</Text>
            <Text style={styles.modalText}>
              We collect personal information including your name, email
              address, age, gender, and medical condition. This information is
              necessary to provide accurate clinical trial matches.
            </Text>

            <Text style={styles.modalSectionTitle}>
              How We Use Your Information
            </Text>
            <Text style={styles.modalText}>
              Your information is used to:
              {'\n'}• Match you with relevant clinical trials
              {'\n'}• Save your bookmarked trials
              {'\n'}• Improve our matching algorithm
              {'\n'}• Communicate important updates about your saved trials
            </Text>

            <Text style={styles.modalSectionTitle}>
              Data Storage & Security
            </Text>
            <Text style={styles.modalText}>
              Your data is stored securely using Firebase Firestore and
              Authentication services. We implement industry-standard security
              measures to protect your personal and medical information.
            </Text>

            <Text style={styles.modalSectionTitle}>Data Sharing</Text>
            <Text style={styles.modalText}>
              We do not sell your personal information. We only share your
              information with clinical trial organizers when you explicitly
              apply to a trial or request to be contacted.
            </Text>

            <Text style={styles.modalSectionTitle}>Your Rights</Text>
            <Text style={styles.modalText}>
              You have the right to:
              {'\n'}• Access your personal information
              {'\n'}• Correct inaccurate information
              {'\n'}• Delete your account and associated data
              {'\n'}• Opt out of communications
            </Text>

            <Text style={styles.modalSectionTitle}>Cookies & Tracking</Text>
            <Text style={styles.modalText}>
              We use essential cookies to maintain your session and preferences.
              No third-party tracking cookies are used.
            </Text>

            <Text style={styles.modalSectionTitle}>Children&aposs Privacy</Text>
            <Text style={styles.modalText}>
              Our service is intended for users of all ages. We require parental
              consent for users under 13 years of age.
            </Text>

            <Text style={styles.modalSectionTitle}>Changes to This Policy</Text>
            <Text style={styles.modalText}>
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes via email or through the app.
            </Text>

            <Text style={styles.modalSectionTitle}>Contact Us</Text>
            <Text style={styles.modalText}>
              If you have questions about this Privacy Policy, contact us at:
              privacy@matchmytrial.com
            </Text>

            <Text style={styles.modalFooter}>Last Updated: April 2025</Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowPrivacyModal(false)}
          >
            <Text style={styles.modalButtonText}>I Understand</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.emoji}>🩺</Text>
          </View>
          <Text style={styles.subtitle}>
            Join MatchMyTrial to find your perfect clinical trial match
          </Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              placeholder="johndoe"
              value={username}
              onChangeText={(text) => {
                setError('');
                setUsername(text);
              }}
              style={styles.input}
              autoCapitalize="none"
              editable={!loading}
            />
            <View style={styles.warningContainer}>
              {/* <AntDesign name="infocirlceo" size={14} color="#F59E0B" /> */}
              <Text style={styles.warningText}>
                For privacy, avoid using your real name as username
              </Text>
            </View>
          </View>

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
                placeholder="Create a password"
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
                  style={styles.eyeText}
                  name={showPassword ? 'eye' : 'eye-invisible'}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.hintText}>Minimum 6 characters</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setError('');
                  setConfirmPassword(text);
                }}
                secureTextEntry={!showConfirmPassword}
                style={styles.passwordInput}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <AntDesign
                  style={styles.eyeText}
                  name={showConfirmPassword ? 'eye' : 'eye-invisible'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms and Conditions Checkbox with Modal Links */}
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setTermsAccepted(!termsAccepted)}
            >
              <View
                style={[
                  styles.checkboxBox,
                  termsAccepted && styles.checkboxBoxChecked,
                ]}
              >
                {termsAccepted && (
                  <AntDesign name="check" size={12} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text
                style={styles.termsLink}
                onPress={() => setShowTermsModal(true)}
              >
                Terms & Conditions
              </Text>{' '}
              and{' '}
              <Text
                style={styles.termsLink}
                onPress={() => setShowPrivacyModal(true)}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.replace('/auth/login')}>
            <Text style={styles.linkText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      <TermsModal />
      <PrivacyModal />
    </KeyboardAvoidingView>
  );
};

export default Signup;

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
    marginBottom: 40,
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
  eyeText: {
    fontSize: 20,
  },
  hintText: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    marginLeft: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
    gap: 6,
  },
  warningText: {
    fontSize: 12,
    color: 'gray',
    flexShrink: 1,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    gap: 12,
  },
  checkbox: {
    padding: 2,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.primary,
  },
  termsText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '500',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
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
  modalContent: {
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginBottom: 8,
  },
  modalFooter: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
