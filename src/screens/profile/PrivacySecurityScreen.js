import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { ArrowLeft, Shield, RefreshCw } from 'lucide-react-native';

import { useTheme } from '../../context/ThemeContext';

export default function PrivacySecurityScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [dataSharing, setDataSharing] = useState(false);
  const [locationServices, setLocationServices] = useState(false);

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
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* System Integrity Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
          <Text style={[styles.heroSubLabel, { color: theme.primary }]}>SYSTEM INTEGRITY</Text>
          <Text style={[styles.heroTitleMain, { color: theme.textPrimary }]}>YOUR SHIELD IS</Text>
          <Text style={[styles.heroTitleCyan, { color: theme.primary }]}>ACTIVE</Text>
          <Text style={[styles.heroBodyText, { color: theme.textSecondary }]}>
            Manage your digital footprint and secure your gaming legacy across the Gamearn.
          </Text>

          {/* Big Shield Ring */}
          <View style={styles.shieldGraphicCenter}>
            <View style={[styles.shieldRingCircle, { borderColor: theme.primary }]}>
              <Shield size={48} color={theme.primary} fill={theme.primaryGlow} />
            </View>
          </View>
        </View>

        {/* Section: DATA & PERMISSIONS */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionTitleRow}>
            <RefreshCw size={18} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>DATA & PERMISSIONS</Text>
          </View>

          <View style={[styles.permissionsGroupCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
            {/* 1. DATA SHARING */}
            <View style={[styles.permissionRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.permItemTitle, { color: theme.textPrimary }]}>DATA SHARING</Text>
                <Text style={[styles.permItemSub, { color: theme.textSecondary }]}>Share gameplay metrics with partners</Text>
              </View>
              <Switch
                value={dataSharing}
                onValueChange={setDataSharing}
                trackColor={{ false: '#334155', true: '#0284C7' }}
                thumbColor={dataSharing ? theme.primary : '#94A3B8'}
              />
            </View>

            {/* 2. LOCATION SERVICES */}
            <View style={[styles.permissionRow, { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.permItemTitle, { color: theme.textPrimary }]}>LOCATION SERVICES</Text>
                <Text style={[styles.permItemSub, { color: theme.textSecondary }]}>Enable local matchmaking servers</Text>
              </View>
              <Switch
                value={locationServices}
                onValueChange={setLocationServices}
                trackColor={{ false: '#334155', true: '#0284C7' }}
                thumbColor={locationServices ? theme.primary : '#94A3B8'}
              />
            </View>
          </View>
        </View>
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
  heroCard: {
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
  },
  heroSubLabel: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitleMain: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  heroTitleCyan: {
    color: '#00E5FF',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 12,
  },
  heroBodyText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
  },
  shieldGraphicCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  shieldRingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  permissionsGroupCard: {
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 18,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  permItemTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  permItemSub: {
    color: '#94A3B8',
    fontSize: 12,
  },
});
