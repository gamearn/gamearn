import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Shield,
  Lock,
  CheckCircle2,
  Mail,
  Smartphone,
  Check,
  KeyRound,
  ShieldCheck,
  Send,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { auth as authApi } from '../../services/api';
import { ApiError } from '../../services/apiClient';
import GAButton from '../../components/GAButton';

export default function AccountSecurityScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { userProfile, updateProfileData } = useAuth();

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [mfaStatus, setMfaStatus] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('email'); // 'email' | 'phone'
  const [email, setEmail] = useState(userProfile?.email || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [verifiedMethod, setVerifiedMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const friendlyError = (err) =>
    err instanceof ApiError ? err.message : err?.message || 'Something went wrong. Please try again.';

  const loadMfaStatus = async () => {
    try {
      const data = await authApi.mfaStatus();
      const mfa = data?.mfa || null;
      setMfaStatus(mfa);
      const configured = !!(mfa && mfa.configured);
      setTwoFactorEnabled(configured);
      if (mfa) {
        if (mfa.mfaEmail && !email) setEmail(mfa.mfaEmail);
        if (mfa.mfaPhone && !phone) setPhone(mfa.mfaPhone);
        if (mfa.mfaEmailVerified) setVerifiedMethod('email');
        if (mfa.mfaPhoneVerified) setVerifiedMethod('phone');
      }
    } catch (err) {
      // Backend unreachable — keep the toggle off and surface nothing blocking.
      console.warn('Could not load MFA status:', err?.message || err);
    }
  };

  useEffect(() => {
    loadMfaStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle2FA = async (val) => {
    if (val) {
      setTwoFactorEnabled(true);
      return;
    }
    // Turning 2FA off requires a genuine backend call.
    setLoading(true);
    try {
      await authApi.mfaDisable();
      setTwoFactorEnabled(false);
      setIsVerifying(false);
      setVerifiedMethod(null);
      setMfaStatus(null);
      if (updateProfileData) {
        try {
          await updateProfileData({ twoFactorEnabled: false });
        } catch (_) {
          // non-blocking
        }
      }
      Alert.alert('2FA Protection Disabled', 'Two-factor authentication has been turned off for this account.');
    } catch (err) {
      Alert.alert('Could not disable 2FA', friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (method) => {
    setSelectedMethod(method);
    setSendingOtp(true);
    const destination = method === 'email' ? email.trim() : phone.trim();
    if (!destination) {
      setSendingOtp(false);
      Alert.alert('Missing detail', 'Enter a valid email or phone number first.');
      return;
    }
    try {
      const data = await authApi.mfaEnroll(method, destination);
      if (method === 'email') {
        setOtpCode(['', '', '', '', '', '']);
        setIsVerifying(true);
        Alert.alert('Verification Code Sent', `A 6-digit code was sent to ${destination}.`);
      } else {
        // Phone factor is delivered by Firebase on the client. The backend has
        // now recorded the enrollment; SMS requires the native SMS module.
        setIsVerifying(false);
        Alert.alert(
          'SMS verification needs a development build',
          'Your phone enrollment is recorded on the server, but sending the SMS code requires the native ' +
            'Firebase SMS module.\n\nRebuild the app with `npx expo run:ios`, then return here to verify your ' +
            'phone. You can enable Email 2FA right now instead.',
        );
      }
    } catch (err) {
      Alert.alert('Could not send code', friendlyError(err));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const codeStr = otpCode.join('');
    if (codeStr.length < 6) {
      Alert.alert('Verification Error', 'Please enter the complete 6-digit verification code.');
      return;
    }
    if (selectedMethod !== 'email') {
      Alert.alert('Unavailable', 'SMS verification requires the development build. Use the Email method.');
      return;
    }
    setLoading(true);
    try {
      await authApi.mfaVerify({ factor: 'email', email: email.trim(), code: codeStr });
      setVerifiedMethod('email');
      setIsVerifying(false);
      setTwoFactorEnabled(true);
      if (updateProfileData) {
        try {
          await updateProfileData({ twoFactorEnabled: true, twoFactorMethod: 'email', email: email.trim() });
        } catch (_) {
          // non-blocking
        }
      }
      loadMfaStatus();
      Alert.alert('2FA Verified Successfully', `Your 2FA is active and verified via Email (${email.trim()}).`);
    } catch (err) {
      Alert.alert('Verification failed', friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screenRoot, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
          style={[styles.backCircleBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}
        >
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Account Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Hero Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.ratingTag, { color: theme.primary }]}>SECURITY RATING</Text>
          <Text style={[styles.heroMainTitle, { color: theme.textPrimary }]}>
            YOUR ACCOUNT{'\n'}IS <Text style={[styles.cyanHighlight, { color: theme.primary }]}>FORTIFIED</Text>
          </Text>
          <Text style={[styles.heroSubText, { color: theme.textSecondary }]}>
            Multi-layer encryption is active. Your gaming assets are protected by Gamearn Void protocols.
          </Text>

          <View style={styles.updatedRow}>
            <CheckCircle2 size={16} color={theme.primary} />
            <Text style={[styles.updatedText, { color: theme.primary }]}>SECURITY ACTIVE</Text>
          </View>
        </View>

        {/* Vault Status Card */}
        <LinearGradient
          colors={isDark ? ['#131B2E', '#0B1220'] : ['#FFFFFF', '#F1F5F9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.vaultCard, { borderColor: isDark ? 'rgba(255, 85, 0, 0.25)' : 'rgba(255, 85, 0, 0.4)' }]}
        >
          <View style={styles.orangeShieldCircle}>
            <Lock size={26} color="#FFFFFF" fill="#FFFFFF" />
          </View>
          <Text style={[styles.vaultTitle, { color: theme.textPrimary }]}>VAULT STATUS</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>LEVEL 4 ACCESS</Text>
          </View>
        </LinearGradient>

        {/* Section: TWO-FACTOR AUTH */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.orangeBar} />
          <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>TWO-FACTOR AUTH</Text>
        </View>

        {/* 2FA Toggle Card */}
        <View style={[styles.twoFactorCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
          <View style={styles.twoFactorTextWrap}>
            <Text style={[styles.twoFactorCardTitle, { color: theme.textPrimary }]}>Enable 2FA Protection</Text>
            <Text style={[styles.twoFactorCardSub, { color: theme.textSecondary }]}>
              Secure your account with a verification code sent to your email or phone number.
            </Text>
          </View>

          <Switch
            value={twoFactorEnabled}
            onValueChange={handleToggle2FA}
            trackColor={{ false: '#334155', true: '#FF5500' }}
            thumbColor={twoFactorEnabled ? '#FFFFFF' : '#94A3B8'}
          />
        </View>

        {/* 2FA Verification Channels */}
        {twoFactorEnabled && (
          <View style={styles.methodsContainer}>
            <Text style={[styles.subSectionTitle, { color: theme.textSecondary }]}>Select Verification Method</Text>

            {/* Email Verification Card */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleSendOtp('email')}
              style={[
                styles.methodCard,
                { backgroundColor: theme.cardBg, borderColor: verifiedMethod === 'email' ? theme.primary : theme.cardBorderSubtle },
              ]}
            >
              <View style={[styles.methodIconBox, { backgroundColor: 'rgba(0, 229, 255, 0.12)' }]}>
                <Mail size={22} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.methodTitle, { color: theme.textPrimary }]}>Email Authentication</Text>
                  {verifiedMethod === 'email' && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.methodValue, { color: theme.textSecondary }]}>{email}</Text>
                <TextInput
                  style={[styles.methodInput, { color: theme.textPrimary, borderColor: theme.cardBorderSubtle }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={[styles.sendCodeBtn, { backgroundColor: theme.primary }]}>
                <Send size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Phone Verification Card */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleSendOtp('phone')}
              style={[
                styles.methodCard,
                { backgroundColor: theme.cardBg, borderColor: verifiedMethod === 'phone' ? '#10B981' : theme.cardBorderSubtle },
              ]}
            >
              <View style={[styles.methodIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Smartphone size={22} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.methodTitle, { color: theme.textPrimary }]}>SMS Phone Verification</Text>
                  {verifiedMethod === 'phone' && (
                    <View style={[styles.verifiedBadge, { backgroundColor: '#10B981' }]}>
                      <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.methodValue, { color: theme.textSecondary }]}>{phone}</Text>
                <TextInput
                  style={[styles.methodInput, { color: theme.textPrimary, borderColor: theme.cardBorderSubtle }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={[styles.sendCodeBtn, { backgroundColor: '#10B981' }]}>
                <Send size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* OTP Verification Card */}
            {isVerifying && (
              <View style={[styles.otpVerificationCard, { backgroundColor: theme.cardBg, borderColor: theme.primary }]}>
                <View style={styles.otpCardHeader}>
                  <KeyRound size={22} color={theme.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.otpCardTitle, { color: theme.textPrimary }]}>
                    Enter 6-Digit Code ({selectedMethod === 'email' ? 'Email' : 'SMS'})
                  </Text>
                </View>

                <Text style={[styles.otpCardSub, { color: theme.textSecondary }]}>
                  Enter the verification code sent to {selectedMethod === 'email' ? email : phone}
                </Text>

                <View style={styles.otpRow}>
                  {otpCode.map((digit, idx) => (
                    <TextInput
                      key={idx}
                      style={[styles.otpInput, { color: theme.textPrimary, borderColor: digit ? theme.primary : theme.cardBorderSubtle }]}
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
                  title={sendingOtp ? 'Sending code...' : 'Verify & Activate 2FA'}
                  onPress={handleVerifyOtp}
                  loading={loading || sendingOtp}
                  variant="primary"
                  style={{ marginTop: 12 }}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#070C1B',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 320,
  },
  heroSection: {
    marginBottom: 24,
  },
  ratingTag: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroMainTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
    marginBottom: 12,
  },
  cyanHighlight: {
    color: '#00E5FF',
  },
  heroSubText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
    maxWidth: 320,
  },
  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  updatedText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  vaultCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 85, 0, 0.25)',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  orangeShieldCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF5500',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5500',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginBottom: 16,
  },
  vaultTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
  },
  levelBadge: {
    backgroundColor: '#FF5500',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  orangeBar: {
    width: 4,
    height: 18,
    backgroundColor: '#FF5500',
    borderRadius: 2,
  },
  sectionTitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  twoFactorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 25, 45, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
  },
  twoFactorTextWrap: {
    flex: 1,
    marginRight: 16,
  },
  twoFactorCardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  twoFactorCardSub: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  methodsContainer: {
    marginTop: 20,
    gap: 12,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  methodIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  methodValue: {
    fontSize: 12,
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: '#00E5FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sendCodeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInput: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    width: '100%',
  },
  otpVerificationCard: {
    marginTop: 12,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  otpCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  otpCardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  otpCardSub: {
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 18,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 12,
  },
  otpInput: {
    width: 50,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
});
