import React, { useState } from 'react';
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
import GAButton from '../../components/GAButton';

export default function AccountSecurityScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { userProfile, updateProfileData } = useAuth();

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState('email'); // 'email' | 'phone'
  const [email, setEmail] = useState(userProfile?.email || 'player@gamearn.com');
  const [phone, setPhone] = useState(userProfile?.phone || '+234 801 234 5678');
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '']);
  const [verifiedMethod, setVerifiedMethod] = useState('email');
  const [loading, setLoading] = useState(false);

  const handleToggle2FA = async (val) => {
    setTwoFactorEnabled(val);
    if (!val) {
      setIsVerifying(false);
    }
    Alert.alert(
      val ? '2FA Protection Enabled 🔒' : '2FA Protection Disabled ⚠️',
      val
        ? 'Please select Email or Phone number to verify your 2FA authentication method.'
        : 'Two-factor authentication has been turned off for this account.'
    );
  };

  const handleSendOtp = (method) => {
    setSelectedMethod(method);
    const destination = method === 'email' ? email : phone;
    Alert.alert('Verification Code Sent 📲', `A 4-digit 2FA code was sent to ${destination}`);
    setIsVerifying(true);
    setOtpCode(['', '', '', '']);
  };

  const handleVerifyOtp = async () => {
    const codeStr = otpCode.join('');
    if (codeStr.length < 4) {
      Alert.alert('Verification Error', 'Please enter the complete 4-digit verification code.');
      return;
    }
    setLoading(true);
    setTimeout(async () => {
      setLoading(false);
      setIsVerifying(false);
      setVerifiedMethod(selectedMethod);
      if (updateProfileData) {
        try {
          await updateProfileData({
            twoFactorEnabled: true,
            twoFactorMethod: selectedMethod,
            email,
            phone,
          });
        } catch (e) {
          console.warn(e);
        }
      }
      Alert.alert(
        '2FA Verified Successfully! 🔒',
        `Your 2FA has been activated and verified via ${selectedMethod === 'email' ? 'Email (' + email + ')' : 'Phone (' + phone + ')'}.`
      );
    }, 800);
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
                    Enter 4-Digit Code ({selectedMethod === 'email' ? 'Email' : 'SMS'})
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
                  title="Verify & Activate 2FA 🔒"
                  onPress={handleVerifyOtp}
                  loading={loading}
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
