import React, { useState, useEffect, useRef } from 'react';
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
import { Mail, ArrowLeft, ArrowRight, ShieldCheck, Clock } from 'lucide-react-native';
import GAButton from '../../components/GAButton';

export default function EmailVerificationScreen({ route, navigation }) {
  const email = route?.params?.email || 'player@gamearn.com';
  const [code, setCode] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(119); // 01:59 countdown
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins} : ${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCodeChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-advance focus
    if (text && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleResend = () => {
    setTimer(119);
    Alert.alert('Code Resent 📧', `A new verification code has been sent to ${email}`);
  };

  const handleVerify = () => {
    const enteredCode = code.join('');
    if (enteredCode.length < 4) {
      setError('Please enter the complete 4-digit code');
      return;
    }
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      navigation.navigate('ProfileCreation', { email });
    }, 800);
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
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Register'))}
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
        {/* Glowing Logo Container */}
        <View style={styles.centerBlock}>
          <View style={styles.glowingBadge}>
            <Image
              source={require('../../../assets/logos/logo_icon.png')}
              style={styles.logoIcon}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>OTP Verification</Text>
          <Text style={styles.subtitle}>
            Enter the code sent to your email to continue your gaming journey.
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* 4 Digit Boxes */}
          <View style={styles.otpRow}>
            {code.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={inputRefs[idx]}
                style={[
                  styles.otpBox,
                  digit ? styles.otpBoxFilled : null,
                  inputRefs[idx].current?.isFocused() ? styles.otpBoxFocused : null,
                ]}
                value={digit}
                onChangeText={(t) => handleCodeChange(t.slice(-1), idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Countdown Timer Pill */}
          <View style={styles.timerPill}>
            <Clock size={14} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
          </View>

          {/* Resend Link */}
          <View style={styles.resendRow}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={handleResend} activeOpacity={0.8}>
              <Text style={styles.resendLink}>Resend Code</Text>
            </TouchableOpacity>
          </View>

          {/* Verify & Continue CTA */}
          <GAButton
            title="Verify & Continue"
            onPress={handleVerify}
            loading={loading}
            variant="primary"
            showArrow={true}
            style={styles.ctaButton}
          />
        </View>

        {/* Footer */}
        <View style={styles.footerWrap}>
          <ShieldCheck size={14} color="#475569" style={{ marginRight: 6 }} />
          <Text style={styles.footerShieldText}>SECURED BY GAMEARN SHIELD</Text>
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
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  centerBlock: {
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
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
    marginBottom: 20,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.85,
    shadowRadius: 16,
    elevation: 10,
  },
  logoIcon: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
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
  otpBoxFocused: {
    borderColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  timerText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  resendText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  resendLink: {
    color: '#FF5500',
    fontSize: 14,
    fontWeight: '800',
  },
  ctaButton: {
    width: '100%',
    marginBottom: 20,
  },
  footerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  footerShieldText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
