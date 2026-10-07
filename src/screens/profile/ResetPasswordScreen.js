import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, KeyRound, CheckCircle2, Mail, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { resetPassword as sendResetEmail } from '../../services/firebase';
import GAButton from '../../components/GAButton';

export default function ResetPasswordScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { userProfile } = useAuth();

  const [email] = useState(userProfile?.email || '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendResetEmail = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Missing Email', 'No valid email address found for your account.');
      return;
    }
    setLoading(true);
    try {
      await sendResetEmail(email.trim());
      setSent(true);
      Alert.alert(
        'Password Reset Email Sent',
        `A password reset link was sent to ${email.trim()}. Check your inbox to choose a new password.`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      Alert.alert('Request Failed', err?.message || 'Could not send reset email. Please try again.');
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
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Settings'))}
          style={[styles.backCircleBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}
        >
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Reset Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.iconHeroCircle}>
          <KeyRound size={32} color="#FF5500" />
        </View>

        <Text style={[styles.mainHeroTitle, { color: theme.textPrimary }]}>RESET YOUR PASSWORD</Text>
        <Text style={[styles.heroSubText, { color: theme.textSecondary }]}>
          Protect your account with a strong password. We will send an official password reset link directly to your registered email.
        </Text>

        {/* Registered Email Card */}
        <View style={[styles.cardBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
          <View style={styles.rowInline}>
            <Mail size={18} color={theme.primary} />
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>REGISTERED EMAIL</Text>
          </View>
          <Text style={[styles.currentValue, { color: theme.textPrimary }]}>{email || 'No email registered'}</Text>
        </View>

        {sent && (
          <View style={styles.successBanner}>
            <CheckCircle2 size={18} color="#10B981" />
            <Text style={styles.successText}>Password reset email sent to {email}. Check your inbox or spam folder.</Text>
          </View>
        )}

        <GAButton
          title={loading ? 'Sending Reset Link...' : 'Send Password Reset Link'}
          onPress={handleSendResetEmail}
          loading={loading}
          variant="primary"
          style={{ marginTop: 16 }}
        />

        <View style={styles.infoNoteBox}>
          <ShieldAlert size={18} color="#F59E0B" />
          <Text style={[styles.infoNoteText, { color: theme.textSecondary }]}>
            After clicking the link in your email, set your new password and sign in again to activate it across all devices.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenRoot: { flex: 1 },
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  iconHeroCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 85, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  mainHeroTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  heroSubText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  cardBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  rowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  currentValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  successText: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 13,
    flex: 1,
  },
  infoNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    padding: 14,
    borderRadius: 14,
    marginTop: 20,
  },
  infoNoteText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
