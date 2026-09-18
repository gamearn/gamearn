import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Copy,
  Users,
  Contact,
  Mail,
  Check,
  Share2,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

const INITIAL_FRIENDS = [
  {
    id: 'f1',
    name: 'ShadowReaper',
    badge: 'PRO',
    badgeBg: '#FF5500',
    tier: 'Diamond Tier • Level 84',
    online: true,
    invited: false,
    avatarEmoji: '👨🏻‍🎤',
    avatarBg: '#FEF08A',
  },
  {
    id: 'f2',
    name: 'Luna_Cyber',
    badge: 'MVP',
    badgeBg: '#8B5CF6',
    tier: 'Master Tier • Level 102',
    online: true,
    invited: false,
    avatarEmoji: '👩🏽‍💻',
    avatarBg: '#BAE6FD',
  },
  {
    id: 'f3',
    name: 'GhostProtocol',
    badge: null,
    tier: 'Gold III • Offline',
    online: false,
    invited: true,
    avatarEmoji: '👨🏼‍💻',
    avatarBg: '#E2E8F0',
  },
  {
    id: 'f4',
    name: 'StormWalker',
    badge: 'PRO',
    badgeBg: '#FF5500',
    tier: 'Platinum I • Level 65',
    online: true,
    invited: false,
    avatarEmoji: '👨🏽‍🚀',
    avatarBg: '#D9F99D',
  },
];

export default function InviteFriendsScreen({ navigation }) {
  const { userProfile } = useAuth();
  const { theme, isDark } = useTheme();
  const username = userProfile?.username || 'CYBER_X_99';
  const referralLink = `gamearn.gg/ref/${username.toUpperCase()}`;

  const [copied, setCopied] = useState(false);
  const [selectedShare, setSelectedShare] = useState('inapp'); // 'inapp', 'contacts', 'email'
  const [friends, setFriends] = useState(INITIAL_FRIENDS);

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert(
      'Referral Link Copied 🚀',
      `Link "${referralLink}" has been copied! Share with your squad to earn 10% commission.`
    );
  };

  const handleShareMethod = (method) => {
    setSelectedShare(method);
    const label =
      method === 'inapp'
        ? 'In-app Friends'
        : method === 'contacts'
        ? 'Device Contacts'
        : 'Email Invite';
    Alert.alert(`Share via ${label}`, `Select squad members below or copy your link to send.`);
  };

  const toggleInviteFriend = (id) => {
    setFriends((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const nextState = !f.invited;
          if (nextState) {
            Alert.alert('Invite Sent 🎮', `An invitation has been sent to ${f.name}.`);
          }
          return { ...f, invited: nextState };
        }
        return f;
      })
    );
  };

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
          style={[styles.backCircleBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}
        >
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Invite Friends</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Hero Card: EARN WHILE THEY PLAY */}
        <LinearGradient
          colors={isDark ? ['#0F2542', '#0A1A30'] : ['#E0F2FE', '#BAE6FD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={[styles.heroTitle, { color: theme.primary }]}>EARN WHILE THEY PLAY</Text>
          <Text style={[styles.heroSub, { color: theme.textSecondary }]}>
            INVITE YOUR SQUAD AND GET 10% COMMISSION ON EVERY TOURNAMENT ENTRY FEE.
          </Text>

          <Text style={[styles.linkFieldLabel, { color: theme.textSecondary }]}>YOUR UNIQUE REFERRAL LINK</Text>
          <View style={[styles.linkBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
            <Text style={[styles.linkText, { color: theme.primary }]} numberOfLines={1}>
              {referralLink}
            </Text>
            <TouchableOpacity activeOpacity={0.85} onPress={handleCopyLink} style={[styles.copyBtn, { backgroundColor: theme.primary }]}>
              {copied ? <Check size={14} color="#FFFFFF" /> : <Copy size={14} color="#FFFFFF" />}
              <Text style={[styles.copyBtnText, { color: '#FFFFFF' }]}>{copied ? 'COPIED' : 'COPY'}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Section: QUICK SHARE METHODS */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>QUICK SHARE METHODS</Text>
          <View style={styles.shareGrid}>
            {/* In-app Friends */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleShareMethod('inapp')}
              style={[
                styles.shareCard,
                { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle },
                selectedShare === 'inapp' && {
                  borderColor: theme.primary,
                  backgroundColor: isDark ? 'rgba(0, 229, 255, 0.08)' : 'rgba(0, 180, 216, 0.1)',
                },
              ]}
            >
              <View style={[styles.shareIconCircle, { backgroundColor: isDark ? 'rgba(0, 229, 255, 0.12)' : 'rgba(0, 180, 216, 0.12)' }]}>
                <Users size={22} color={theme.primary} />
              </View>
              <Text style={[styles.shareCardText, { color: theme.textPrimary }]}>In-app Friends</Text>
            </TouchableOpacity>

            {/* Contacts */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleShareMethod('contacts')}
              style={[
                styles.shareCard,
                { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle },
                selectedShare === 'contacts' && {
                  borderColor: theme.primary,
                  backgroundColor: isDark ? 'rgba(0, 229, 255, 0.08)' : 'rgba(0, 180, 216, 0.1)',
                },
              ]}
            >
              <View style={[styles.shareIconCircle, { backgroundColor: isDark ? 'rgba(0, 229, 255, 0.12)' : 'rgba(0, 180, 216, 0.12)' }]}>
                <Contact size={22} color={theme.primary} />
              </View>
              <Text style={[styles.shareCardText, { color: theme.textPrimary }]}>Contacts</Text>
            </TouchableOpacity>

            {/* Email */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleShareMethod('email')}
              style={[
                styles.shareCard,
                { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle },
                selectedShare === 'email' && {
                  borderColor: theme.primary,
                  backgroundColor: isDark ? 'rgba(0, 229, 255, 0.08)' : 'rgba(0, 180, 216, 0.1)',
                },
              ]}
            >
              <View style={[styles.shareIconCircle, { backgroundColor: isDark ? 'rgba(0, 229, 255, 0.12)' : 'rgba(0, 180, 216, 0.12)' }]}>
                <Mail size={22} color={theme.primary} />
              </View>
              <Text style={[styles.shareCardText, { color: theme.textPrimary }]}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: ACTIVE FRIENDS */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>ACTIVE FRIENDS</Text>
          {friends.map((friend) => (
            <View key={friend.id} style={[styles.friendCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
              {/* Avatar + Status Dot */}
              <View style={{ position: 'relative' }}>
                <View style={[styles.avatarBox, { backgroundColor: friend.avatarBg }]}>
                  <Text style={{ fontSize: 24 }}>{friend.avatarEmoji}</Text>
                </View>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: friend.online ? '#00FF66' : '#64748B', borderColor: theme.cardBg },
                  ]}
                />
              </View>

              {/* Friend Info */}
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={styles.nameRow}>
                  <Text style={[styles.friendName, { color: theme.textPrimary }]}>{friend.name}</Text>
                  {friend.badge && (
                    <View style={[styles.badgeTag, { backgroundColor: friend.badgeBg }]}>
                      <Text style={styles.badgeTagText}>{friend.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.friendTier, { color: theme.textSecondary }]}>{friend.tier}</Text>
              </View>

              {/* Invite Action Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => toggleInviteFriend(friend.id)}
                style={[styles.inviteBtn, friend.invited && styles.sentBtn]}
              >
                <Text style={[styles.inviteBtnText, friend.invited && styles.sentBtnText]}>
                  {friend.invited ? 'Sent' : 'Invite'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
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
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    marginBottom: 24,
  },
  heroTitle: {
    color: '#00E5FF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  heroSub: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  linkFieldLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 12, 27, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.4)',
    borderRadius: 14,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
  },
  linkText: {
    flex: 1,
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00E5FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  copyBtnText: {
    color: '#070C1B',
    fontSize: 12,
    fontWeight: '900',
  },
  sectionWrap: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 14,
  },
  shareGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  shareCard: {
    flex: 1,
    height: 110,
    backgroundColor: 'rgba(15, 25, 45, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  shareCardActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  shareIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shareCardText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#070C1B',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  friendName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  badgeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  friendTier: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  inviteBtn: {
    backgroundColor: '#FF5500',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  inviteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sentBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  sentBtnText: {
    color: '#94A3B8',
  },
});
