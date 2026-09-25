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
} from 'react-native';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import GAButton from '../../components/GAButton';
import GAInput from '../../components/GAInput';
import { resetPassword, friendlyAuthError } from '../../services/firebase';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSendReset = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Real Firebase password reset — sends an email with a reset link.
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flexContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Auth Background with Overlay */}
      <Image
        source={require('../../../assets/auth/register_bg.png')}
        style={styles.fixedBackground}
        resizeMode="cover"
      />
      <View style={styles.fixedDarkOverlay} />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Login');
            }
          }}
          style={styles.backCircleBtn}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Logo Badge */}
        <View style={styles.logoSection}>
          <View style={styles.glowingBadge}>
            <Image
              source={require('../../../assets/logos/logo_dark.png')}
              style={styles.logoIcon}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Dynamic Heading */}
        <View style={styles.headingSection}>
          <Text style={styles.title}>{sent ? 'Email Sent' : 'Reset Password'}</Text>
          <Text style={styles.subtitle}>
            {sent
              ? `Check your inbox for a secure link to reset your password. We sent it to ${email}`
              : 'Enter your registered email and we\u2019ll send you a secure password reset link.'}
          </Text>
        </View>

        {/* Main Form Content */}
        <View style={styles.formContainer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {sent ? (
            <View style={styles.successCard}>
              <View style={styles.successCheckCircle}>
                <CheckCircle2 size={36} color="#00E5FF" />
              </View>
              <Text style={styles.successTitle}>Reset Link Sent!</Text>
              <Text style={styles.successMessage}>
                Follow the link in your email to choose a new password, then sign in with your new
                credentials.
              </Text>
              <GAButton
                title="Log In"
                onPress={() => navigation.navigate('Login')}
                variant="primary"
                showArrow={true}
                style={{ width: '100%' }}
              />
            </View>
          ) : (
            <View>
              <GAInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={<Mail size={20} color="#64748B" />}
              />
              <GAButton
                title="Send Reset Link"
                onPress={handleSendReset}
                loading={loading}
                variant="primary"
                showArrow={true}
                style={styles.btnSpacing}
              />
            </View>
          )}

          {/* Footer Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Remember your password? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.footerLink}>Log In</Text>
            </TouchableOpacity>
          </View>

          {/* Tagline Footer */}
          <View style={styles.bottomFooter}>
            <Text style={styles.footerTagline}>
              PLAY <Text style={{ color: '#00E5FF' }}>•</Text> EARN <Text style={{ color: '#FF6B00' }}>•</Text> BELONG
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
    backgroundColor: '#070C1B',
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
    backgroundColor: 'rgba(10, 14, 26, 0.75)',
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 10,
    zIndex: 10,
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 320,
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  glowingBadge: {
    width: 165,
    height: 165,
    borderRadius: 34,
    backgroundColor: '#0B132B',
    borderWidth: 2,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    overflow: 'hidden',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 16,
    elevation: 10,
  },
  logoIcon: {
    width: '100%',
    height: '100%',
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 24,
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
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
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
  btnSpacing: {
    marginTop: 8,
    marginBottom: 16,
  },
  successCard: {
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  successCheckCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  successMessage: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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