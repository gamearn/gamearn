import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { User, Mail, Lock, Check, ArrowLeft } from 'lucide-react-native';
import GAButton from '../../components/GAButton';
import GAInput from '../../components/GAInput';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('+234');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!agreed) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signUp(email.trim(), password, fullName);
      navigation.navigate('EmailVerification', { email: email.trim() });
    } catch (e) {
      setError(e.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCountryCode = () => {
    Alert.alert('Select Country Code', 'Supported regions: +234 (Nigeria), +1 (USA), +44 (UK), +254 (Kenya)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flexContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Fixed Non-Repeating Background Image */}
      <Image
        pointerEvents="none"
        source={require('../../../assets/auth/register_bg.png')}
        style={styles.fixedBackground}
        resizeMode="cover"
      />
      <View pointerEvents="none" style={styles.fixedDarkOverlay} />

      {/* Top Header Navigation */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Landing'))}
          style={styles.backCircleBtn}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Logo */}
        <View style={styles.logoSection}>
          <View style={styles.glowingBadge}>
            <Image
              source={require('../../../assets/logos/logo_icon.png')}
              style={styles.logoIcon}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Heading */}
        <View style={styles.headingSection}>
          <Text style={styles.title}>Join GAMEARN</Text>
          <Text style={styles.subtitle}>Play your favourites. Earn rewards. Belong.</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <GAInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g. Chinelo Adebayo"
            leftIcon={<User size={20} color="#64748B" />}
          />

          <GAInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            keyboardType="email-address"
            leftIcon={<Mail size={20} color="#64748B" />}
          />

          <GAInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="801 234 5678"
            isPhone={true}
            phoneCode={phoneCode}
            onSelectPhoneCode={handleSelectCountryCode}
          />

          <GAInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            secureTextEntry={true}
            leftIcon={<Lock size={20} color="#64748B" />}
            subLabel="Use at least 8 characters."
          />

          {/* Checkbox Agreement */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
              {agreed && <Check size={12} color="#FFFFFF" />}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text
                style={styles.termsLink}
                onPress={() => Alert.alert('Terms of Service', 'Gamearn Terms of Service agreement.')}
              >
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                style={styles.termsLink}
                onPress={() => Alert.alert('Privacy Policy', 'Gamearn Privacy Policy agreement.')}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </TouchableOpacity>

          {/* Create Account CTA */}
          <GAButton
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            variant="primary"
            showArrow={true}
            style={styles.registerBtn}
          />

          {/* Footer Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.footerLink}>Log In</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Tagline */}
          <View style={styles.bottomFooter}>
            <Text style={styles.footerTagline}>
              PLAY  <Text style={{ color: '#00E5FF' }}>•</Text>  EARN  <Text style={{ color: '#FF6B00' }}>•</Text>  BELONG
            </Text>
            <View style={styles.footerIndicator} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  fixedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    ...(Platform.OS === 'web'
      ? {
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : {}),
  },
  fixedDarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 14, 26, 0.7)',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 320,
    alignItems: 'center',
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 10,
    zIndex: 10,
    alignItems: 'flex-start',
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  glowingBadge: {
    width: 125,
    height: 125,
    borderRadius: 28,
    backgroundColor: '#0B132B',
    borderWidth: 2,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 16,
    elevation: 10,
  },
  logoIcon: {
    width: '90%',
    height: '90%',
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  checkboxActive: {
    backgroundColor: '#00E5FF',
  },
  termsText: {
    color: '#94A3B8',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  termsLink: {
    color: '#00E5FF',
    fontWeight: '700',
  },
  registerBtn: {
    marginTop: 8,
    marginBottom: 20,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  footerLink: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomFooter: {
    alignItems: 'center',
  },
  footerTagline: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  footerIndicator: {
    width: 60,
    height: 3,
    backgroundColor: '#00E5FF',
    borderRadius: 2,
    marginTop: 6,
  },
});
