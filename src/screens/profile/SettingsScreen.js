import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Shield,
  CreditCard,
  Moon,
  Mail,
  Globe,
  Lock,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  const [emailAlerts, setEmailAlerts] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of Gamearn?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
        },
      },
    ]);
  };

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.bg }]}>
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
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Settings & Preferences</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: ACCOUNT & SECURITY */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>ACCOUNT & SECURITY</Text>

          <View style={[styles.menuGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AccountSecurity')}
              style={styles.menuRow}
            >
              <View style={[styles.iconSquare, { backgroundColor: theme.primaryGlow }]}>
                <Shield size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.menuItemTitle, { color: theme.textPrimary }]}>Account Security</Text>
                <Text style={[styles.menuItemSub, { color: theme.textSecondary }]}>Password, 2FA and sessions</Text>
              </View>
              <ChevronRight size={18} color={theme.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Withdraw')}
              style={[styles.menuRow, { borderBottomWidth: 0 }]}
            >
              <View style={[styles.iconSquare, { backgroundColor: theme.primaryGlow }]}>
                <CreditCard size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.menuItemTitle, { color: theme.textPrimary }]}>Payout Methods</Text>
                <Text style={[styles.menuItemSub, { color: theme.textSecondary }]}>Bank accounts & wallets</Text>
              </View>
              <ChevronRight size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: GAME PREFERENCES */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>GAME PREFERENCES</Text>

          <View style={[styles.menuGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
            {/* Theme Preference */}
            <View style={styles.menuRow}>
              <View style={[styles.iconSquare, { backgroundColor: theme.primaryGlow }]}>
                <Moon size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.menuItemTitle, { color: theme.textPrimary }]}>Theme Preference</Text>
                <Text style={[styles.menuItemSub, { color: theme.textSecondary }]}>{isDark ? 'Dark Mode Active' : 'Light Mode Active'}</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#CBD5E1', true: '#0284C7' }}
                thumbColor={isDark ? theme.primary : '#FFFFFF'}
              />
            </View>

            {/* Email Alerts */}
            <View style={styles.menuRow}>
              <View style={[styles.iconSquare, { backgroundColor: theme.primaryGlow }]}>
                <Mail size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.menuItemTitle, { color: theme.textPrimary }]}>Email Alerts</Text>
                <Text style={[styles.menuItemSub, { color: theme.textSecondary }]}>Weekly rewards summary</Text>
              </View>
              <Switch
                value={emailAlerts}
                onValueChange={setEmailAlerts}
                trackColor={{ false: '#CBD5E1', true: '#0284C7' }}
                thumbColor={emailAlerts ? theme.primary : '#FFFFFF'}
              />
            </View>

            {/* Language */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Language')}
              style={styles.menuRow}
            >
              <View style={[styles.iconSquare, { backgroundColor: theme.primaryGlow }]}>
                <Globe size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.menuItemTitle, { color: theme.textPrimary }]}>Language</Text>
                <Text style={[styles.menuItemSub, { color: theme.textSecondary }]}>English (NG)</Text>
              </View>
              <ChevronRight size={18} color={theme.textMuted} />
            </TouchableOpacity>

            {/* Privacy & Security */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('PrivacySecurity')}
              style={styles.menuRow}
            >
              <View style={[styles.iconSquare, { backgroundColor: theme.primaryGlow }]}>
                <Lock size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.menuItemTitle, { color: theme.textPrimary }]}>Privacy & Security</Text>
                <Text style={[styles.menuItemSub, { color: theme.textSecondary }]}>Game security update</Text>
              </View>
              <ChevronRight size={18} color={theme.textMuted} />
            </TouchableOpacity>

            {/* Help & Support */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('HelpSupport')}
              style={[styles.menuRow, { borderBottomWidth: 0 }]}
            >
              <View style={[styles.iconSquare, { backgroundColor: theme.primaryGlow }]}>
                <HelpCircle size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.menuItemTitle, { color: theme.textPrimary }]}>Help & Support</Text>
                <Text style={[styles.menuItemSub, { color: theme.textSecondary }]}>Get important information</Text>
              </View>
              <ChevronRight size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleLogout}
          style={styles.logoutBtn}
        >
          <LogOut size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
          <Text style={[styles.logoutBtnText, { color: theme.textMuted }]}>Logout</Text>
        </TouchableOpacity>

        {/* Footer Version */}
        <Text style={[styles.versionText, { color: theme.textMuted }]}>GAMEARN Premium v2.4.1</Text>
      </ScrollView>
    </View>
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
    paddingBottom: 40,
  },
  sectionWrap: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
  },
  menuGroupCard: {
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  iconSquare: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  menuItemSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 16,
  },
  logoutBtnText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '800',
  },
  versionText: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
});
