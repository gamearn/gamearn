import React, { useEffect, useRef, useState } from 'react';
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
import { ArrowLeft, Phone, MessageSquareText } from 'lucide-react-native';
import GAButton from '../../components/GAButton';
import GAInput from '../../components/GAInput';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

const RESEND_AFTER_SECONDS = 30;
const CODE_LENGTH = 6;

export default function PhoneLoginScreen({ navigation }) {
  const { sendPhoneOtp, verifyPhoneOtp, backendReady, user, loading: authLoading, authError } = useAuth();
  const focused = useIsFocused();
  const [phase, setPhase] = useState('phone'); // 'phone' | 'code'
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const didNavigate = useRef(false);
  const resendTimer = useRef(null);

  useEffect(() => {
    const routeHome = () => {
      if (didNavigate.current || !focused || authLoading || !user) return;
      didNavigate.current = true;
      navigation.replace(backendReady ? 'MainTabs' : 'ProfileSetup', {
        ...(user.email ? { email: user.email } : {}),
        phone: sentTo,
      });
    };
    routeHome();
  }, [user, backendReady, authLoading, focused, navigation, sentTo]);

  useEffect(() => () => clearInterval(resendTimer.current), []);

  const startResendCountdown = () => {
    setResendIn(RESEND_AFTER_SECONDS);
    clearInterval(resendTimer.current);
    resendTimer.current = setInterval(() => {
      setResendIn((prev) => {
        if (prev <= 1) {
          clearInterval(resendTimer.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!phone.trim()) {
      setError('Enter your phone number.');
      return;
    }
    setError('');
    setSending(true);
    setInfo('');
    try {
      const result = await sendPhoneOtp(phone.trim());
      setSentTo(result.phone);
      startResendCountdown();
      setPhase('code');
      setInfo(`A 6-digit code was sent to ${result.phone}. Enter it below to verify.`);
    } catch (e) {
      setError(e.message || 'Could not send the code. Try again.');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== CODE_LENGTH) {
      setError(`Enter the ${CODE_LENGTH}-digit code from the SMS.`);
      return;
    }
    setError('');
    setVerifying(true);
    try {
      await verifyPhoneOtp(code);
      // Profile load + navigation happen via the routeHome effect.
    } catch (e) {
      setError(e.message || 'Could not verify the code. Try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flexContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Image
        pointerEvents="none"
        source={require('../../../assets/auth/login_bg.png')}
        style={styles.fixedBackground}
        resizeMode="cover"
      />
      <View pointerEvents="none" style={styles.fixedDarkOverlay} />

      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Login'))}
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
        <View style={styles.logoSection}>
          <View style={styles.glowingBadge}>
            <Image
              source={require('../../../assets/logos/logo_icon.png')}
              style={styles.logoIcon}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.headingSection}>
          <Text style={styles.title}>{phase === 'phone' ? 'Sign in with Phone' : 'Enter the Code'}</Text>
          <Text style={styles.subtitle}>
            {phase === 'phone'
              ? 'We will text you a secure one-time code.'
              : `A code was sent to ${sentTo || 'your phone'}.`}
          </Text>
        </View>

        <View style={styles.formContainer}>
          {(error || authError) ? <Text style={styles.errorText}>{error || authError}</Text> : null}
          {info ? <Text style={styles.infoText}>{info}</Text> : null}

          {phase === 'phone' ? (
            <>
              <GAInput
                label="Phone Number"
                value={phone}
                onChangeText={(t) => setPhone(t)}
                placeholder="0801 234 5678"
                keyboardType="phone-pad"
                leftIcon={<Phone size={20} color="#64748B" />}
                maxLength={16}
              />
              <Text style={styles.helperText}>
                Nigerian numbers work as 0801 234 5678. You receive an SMS with a code to sign in.
              </Text>
              <GAButton
                title="Send SMS Code"
                onPress={handleSendCode}
                loading={sending}
                variant="primary"
                showArrow={true}
                style={styles.primaryBtn}
              />
            </>
          ) : (
            <>
              <GAInput
                label="Verification Code"
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, CODE_LENGTH))}
                placeholder="••••••"
                keyboardType="number-pad"
                leftIcon={<MessageSquareText size={20} color="#64748B" />}
                maxLength={CODE_LENGTH}
              />
              <TouchableOpacity
                onPress={() => { if (resendIn > 0 || sending) return; handleSendCode(); }}
                disabled={resendIn > 0 || sending}
                style={styles.resendBtn}
                activeOpacity={0.8}
              >
                <Text style={resendIn > 0 ? styles.resendDisabledText : styles.resendText}>
                  {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setPhase('phone'); setError(''); setInfo(''); setSentTo(''); }}
                style={styles.changePhoneBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.changePhoneText}>Use a different number</Text>
              </TouchableOpacity>
              <GAButton
                title="Verify & Sign In"
                onPress={handleVerify}
                loading={verifying}
                variant="primary"
                showArrow={true}
                style={styles.primaryBtn}
              />
            </>
          )}

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Prefer email? </Text>
            <TouchableOpacity
              onPress={() => navigation.replace('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.footerLink}>Back to Email Login</Text>
            </TouchableOpacity>
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
  },
  fixedDarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 14, 26, 0.35)',
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
    marginBottom: 20,
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
    width: '100%',
    height: '100%',
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
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
  infoText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  helperText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: -4,
    marginBottom: 18,
  },
  primaryBtn: {
    marginBottom: 18,
    marginTop: 6,
  },
  resendBtn: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
    paddingVertical: 8,
  },
  resendText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '700',
  },
  resendDisabledText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  changePhoneBtn: {
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  changePhoneText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 28,
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
});