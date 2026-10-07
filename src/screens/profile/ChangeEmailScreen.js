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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import GAButton from '../../components/GAButton';

export default function ChangeEmailScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { userProfile, updateProfileData } = useAuth();

  const [currentEmail] = useState(userProfile?.email || '');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSaveEmail = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (trimmed === currentEmail.toLowerCase()) {
      Alert.alert('No Change', 'The new email address must be different from your current email.');
      return;
    }

    setLoading(true);
    try {
      if (updateProfileData) {
        await updateProfileData({ email: trimmed });
      }
      setSuccess(true);
      Alert.alert(
        'Email Address Updated',
        `Your email address has been changed to ${trimmed}. This change is now active across your account.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Update Failed', err?.message || 'Could not update your email address. Please try again.');
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
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Change Email</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.iconHeroCircle}>
          <Mail size={32} color="#00E5FF" />
        </View>

        <Text style={[styles.mainHeroTitle, { color: theme.textPrimary }]}>UPDATE YOUR EMAIL</Text>
        <Text style={[styles.heroSubText, { color: theme.textSecondary }]}>
          Your email address is used for sign-in, security alerts, and account recovery.
        </Text>

        {/* Current Email Box */}
        <View style={[styles.cardBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>CURRENT EMAIL</Text>
          <Text style={[styles.currentEmailValue, { color: theme.textPrimary }]}>{currentEmail || 'Not set'}</Text>
        </View>

        {/* New Email Input */}
        <View style={[styles.cardBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
          <Text style={[styles.fieldLabel, { color: theme.primary }]}>NEW EMAIL ADDRESS</Text>
          <TextInput
            style={[styles.input, { color: theme.textPrimary, borderColor: theme.cardBorderSubtle, backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#FFF' }]}
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="Enter new email address"
            placeholderTextColor={theme.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {success && (
          <View style={styles.successBanner}>
            <CheckCircle2 size={18} color="#10B981" />
            <Text style={styles.successText}>Email address updated successfully!</Text>
          </View>
        )}

        <GAButton
          title={loading ? 'Updating Email...' : 'Save Email Address'}
          onPress={handleSaveEmail}
          loading={loading}
          variant="primary"
          style={{ marginTop: 16 }}
        />
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
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
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
  fieldLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  currentEmailValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '700',
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
  },
});
