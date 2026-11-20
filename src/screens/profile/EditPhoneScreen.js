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
import { ArrowLeft, Smartphone, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { normalizePhoneToE164 } from '../../services/firebase';
import GAButton from '../../components/GAButton';

export default function EditPhoneScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { userProfile, updateProfileData } = useAuth();

  const [currentPhone] = useState(userProfile?.phone || userProfile?.phoneNumber || '');
  const [newPhone, setNewPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSavePhone = async () => {
    const raw = newPhone.trim();
    if (!raw) {
      Alert.alert('Missing Detail', 'Please enter a valid phone number.');
      return;
    }
    const normalized = normalizePhoneToE164(raw);
    if (!normalized) {
      Alert.alert('Invalid Phone', 'Enter a valid Nigerian phone number (e.g. 0803 123 4567).');
      return;
    }

    setLoading(true);
    try {
      if (updateProfileData) {
        await updateProfileData({ phone: normalized, phoneNumber: normalized });
      }
      setSuccess(true);
      Alert.alert(
        'Phone Number Updated',
        `Your phone number has been updated to ${normalized}. This change is now active across your account.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Update Failed', err?.message || 'Could not update your phone number. Please try again.');
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
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Edit Phone Number</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.iconHeroCircle}>
          <Smartphone size={32} color="#10B981" />
        </View>

        <Text style={[styles.mainHeroTitle, { color: theme.textPrimary }]}>UPDATE PHONE NUMBER</Text>
        <Text style={[styles.heroSubText, { color: theme.textSecondary }]}>
          Your phone number is used for SMS verification, 2FA security, and withdrawal confirmations.
        </Text>

        {/* Current Phone Box */}
        <View style={[styles.cardBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>CURRENT PHONE NUMBER</Text>
          <Text style={[styles.currentValue, { color: theme.textPrimary }]}>{currentPhone || 'Not set'}</Text>
        </View>

        {/* New Phone Input */}
        <View style={[styles.cardBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
          <Text style={[styles.fieldLabel, { color: '#10B981' }]}>NEW PHONE NUMBER</Text>
          <TextInput
            style={[styles.input, { color: theme.textPrimary, borderColor: theme.cardBorderSubtle, backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#FFF' }]}
            value={newPhone}
            onChangeText={setNewPhone}
            placeholder="e.g. 0803 123 4567"
            placeholderTextColor={theme.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        {success && (
          <View style={styles.successBanner}>
            <CheckCircle2 size={18} color="#10B981" />
            <Text style={styles.successText}>Phone number updated successfully!</Text>
          </View>
        )}

        <GAButton
          title={loading ? 'Updating Phone Number...' : 'Save Phone Number'}
          onPress={handleSavePhone}
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
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
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
  currentValue: {
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
