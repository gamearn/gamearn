import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Mail, ArrowLeft, Lock, CheckCircle2, KeyRound } from 'lucide-react-native';
import GAButton from '../../components/GAButton';
import GAInput from '../../components/GAInput';

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 800);
  };

  const handleVerifyOtp = () => {
    const codeStr = otpCode.join('');
    if (codeStr.length < 4) {
      setError('Please enter the 4-digit code sent to your email.');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 800);
  };

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(4);
    }, 900);
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
            if (step > 1 && step < 4) {
              setStep(step - 1);
            } else if (navigation.canGoBack()) {
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
              source={require('../../../assets/logos/logo_icon.png')}
              style={styles.logoIcon}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Dynamic Heading based on step */}
        <View style={styles.headingSection}>
          <Text style={styles.title}>
            {step === 1 && 'Reset Password'}
            {step === 2 && 'OTP Verification'}
            {step === 3 && 'New Password'}
            {step === 4 && 'Password Reset'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 1 && 'Enter your registered email to receive password reset OTP code.'}
            {step === 2 && `We sent a 4-digit code to ${email}`}
            {step === 3 && 'Create a strong new password for your Gamearn account.'}
            {step === 4 && 'Your password has been reset successfully! You can now log in.'}
          </Text>
        </View>

        {/* Main Form Content */}
        <View style={styles.formContainer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* STEP 1: Email Input */}
          {step === 1 && (
            <View>
              <GAInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                keyboardType="email-address"
                leftIcon={<Mail size={20} color="#64748B" />}
              />
              <GAButton
                title="Send Reset Code"
                onPress={handleSendOtp}
                loading={loading}
                variant="primary"
                showArrow={true}
                style={styles.btnSpacing}
              />
            </View>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 2 && (
            <View style={{ alignItems: 'center' }}>
              <View style={styles.otpRow}>
                {otpCode.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                    value={digit}
                    onChangeText={(t) => {
                      const updated = [...otpCode];
                      updated[idx] = t.slice(-1);
                      setOtpCode(updated);
                    }}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>
              <GAButton
                title="Verify Code"
                onPress={handleVerifyOtp}
                loading={loading}
                variant="primary"
                showArrow={true}
                style={styles.btnSpacing}
              />
            </View>
          )}

          {/* STEP 3: New Password Input */}
          {step === 3 && (
            <View>
              <GAInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry={true}
                leftIcon={<Lock size={20} color="#64748B" />}
                subLabel="Must be at least 8 characters."
              />
              <GAInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                secureTextEntry={true}
                leftIcon={<Lock size={20} color="#64748B" />}
              />
              <GAButton
                title="Reset Password"
                onPress={handleResetPassword}
                loading={loading}
                variant="primary"
                showArrow={true}
                style={styles.btnSpacing}
              />
            </View>
          )}

          {/* STEP 4: Success State */}
          {step === 4 && (
            <View style={styles.successCard}>
              <View style={styles.successCheckCircle}>
                <CheckCircle2 size={36} color="#00E5FF" />
              </View>
              <Text style={styles.successTitle}>Password Updated!</Text>
              <Text style={styles.successMessage}>
                Your account password has been updated. Please sign in with your new credentials.
              </Text>
              <GAButton
                title="Log In Now"
                onPress={() => navigation.navigate('Login')}
                variant="primary"
                showArrow={true}
                style={{ width: '100%' }}
              />
            </View>
          )}

          {/* Footer Link */}
          {step < 4 && (
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.8}
              >
                <Text style={styles.footerLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          )}

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
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  otpBox: {
    width: 60,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
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
