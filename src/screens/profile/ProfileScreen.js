import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Flame, CheckCircle2, Search } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileScreen({ navigation }) {
  const { userProfile } = useAuth();
  const { theme, isDark } = useTheme();
  const userName = userProfile?.username || userProfile?.fullName || userProfile?.name || 'Adebayo';
  const [searchQuery, setSearchQuery] = useState('');
  const friendsList = userProfile?.friends || [];
  const onlineCount = friendsList.filter((f) => f.isOnline).length;

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />

      {/* Screen Title */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
          style={[styles.backCircleBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}
        >
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Profile Avatar & Info Header */}
        <View style={styles.heroCenterBlock}>
          <View style={styles.avatarWrap}>
            <Image
              source={{
                uri:
                  (userProfile?.avatar && typeof userProfile.avatar === 'string' && userProfile.avatar.startsWith('http'))
                    ? userProfile.avatar
                    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
              }}
              style={styles.avatarImg}
            />
            <View style={styles.onlineDot} />
          </View>

          <Text style={[styles.userNameText, { color: theme.textPrimary }]}>{userName}</Text>

          <View style={styles.proCompetitorBadge}>
            <CheckCircle2 size={13} color="#FF5500" style={{ marginRight: 4 }} />
            <Text style={[styles.proCompetitorText, { color: theme.textSecondary }]}>Pro League Competitor</Text>
          </View>
        </View>

        {/* Action Buttons (Edit Profile & Wallet) */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('EditProfile')}
            style={styles.editProfileBtn}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('WalletTab')}
            style={[styles.walletBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}
          >
            <Text style={[styles.walletBtnText, { color: theme.textPrimary }]}>Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row (Followers, Following, Day Streak) */}
        <View style={styles.statsGridRow}>
          <View style={[styles.statCardBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
            <Text style={[styles.statBigVal, { color: theme.textPrimary }]}>{userProfile?.followersCount ?? 0}</Text>
            <Text style={[styles.statSubLabel, { color: theme.textSecondary }]}>FOLLOWERS</Text>
          </View>

          <View style={[styles.statCardBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
            <Text style={[styles.statBigVal, { color: theme.textPrimary }]}>{userProfile?.followingCount ?? 0}</Text>
            <Text style={[styles.statSubLabel, { color: theme.textSecondary }]}>FOLLOWING</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('DailyStreak')}
            style={[
              styles.statCardBox,
              {
                backgroundColor: theme.cardBg,
                borderColor: (userProfile?.streak ?? 0) > 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
              },
            ]}
          >
            <View style={styles.streakInlineRow}>
              <Flame
                size={16}
                color={(userProfile?.streak ?? 0) > 0 ? '#10B981' : '#EF4444'}
                fill={(userProfile?.streak ?? 0) > 0 ? '#10B981' : 'none'}
                style={{ marginRight: 2 }}
              />
              <Text
                style={[
                  styles.streakBigVal,
                  { color: (userProfile?.streak ?? 0) > 0 ? '#10B981' : '#EF4444' },
                ]}
              >
                {userProfile?.streak ?? 0}
              </Text>
            </View>
            <Text
              style={[
                styles.streakSubLabel,
                { color: (userProfile?.streak ?? 0) > 0 ? '#10B981' : '#EF4444' },
              ]}
            >
              {(userProfile?.streak ?? 0) > 0 ? 'ACTIVE STREAK' : 'INACTIVE'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Game Power (GP) & Value Points (VP) Row */}
        <View style={{ flexDirection: 'row', gap: 10, marginVertical: 8 }}>
          <View
            style={[
              styles.statCardBox,
              {
                flex: 1,
                backgroundColor: '#1E1B4B',
                borderColor: '#6366F1AA',
                borderWidth: 1,
                paddingVertical: 14,
              },
            ]}
          >
            <Text style={{ color: '#F59E0B', fontSize: 20, fontWeight: '900' }}>
              ⚡ {userProfile?.gpText || '0 GP'}
            </Text>
            <Text style={{ color: '#A5B4FC', fontSize: 11, fontWeight: '800', marginTop: 2 }}>
              GAME POWER (GP)
            </Text>
          </View>

          <View
            style={[
              styles.statCardBox,
              {
                flex: 1,
                backgroundColor: '#0F172A',
                borderColor: '#3B82F6AA',
                borderWidth: 1,
                paddingVertical: 14,
              },
            ]}
          >
            <Text style={{ color: '#60A5FA', fontSize: 20, fontWeight: '900' }}>
              🏆 {userProfile?.vpText || '0 VP'}
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '800', marginTop: 2 }}>
              VALUE POINTS (VP)
            </Text>
          </View>
        </View>

        {/* Referrals & 5% Commission Entry Banner */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => navigation.navigate('Referrals')}
          style={{
            marginVertical: 14,
            borderRadius: 18,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#3B82F644',
          }}
        >
          <LinearGradient
            colors={['#0F172A', '#1E1B4B', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <View style={{ backgroundColor: '#3B82F622', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                  <Text style={{ color: '#60A5FA', fontSize: 11, fontWeight: '900' }}>5% COMMISSION</Text>
                </View>
                <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '800' }}>👑 Grow Your Squad</Text>
              </View>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginBottom: 2 }}>Referrals & Squad Earnings</Text>
              <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>Earn 5% of everything your referrals earn forever.</Text>
            </View>
            <View style={{ backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, elevation: 4 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>Check Referrals</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Search Friends Input */}
        <View style={[styles.searchBarWrap, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
          <Search size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Friends"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        {/* Active Friends List Section */}
        <View style={styles.friendsSectionHeader}>
          <Text style={[styles.friendsTitle, { color: theme.textSecondary }]}>ACTIVE FRIENDS</Text>
          <Text style={styles.onlineCountText}>{onlineCount} Online</Text>
        </View>

        <View style={styles.friendsList}>
          {friendsList.length === 0 ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '600' }}>No active friends yet.</Text>
            </View>
          ) : (
            friendsList.filter((f) => (f.name || f.username || '').toLowerCase().includes(searchQuery.toLowerCase())).map((friend) => (
              <View key={friend.id} style={[styles.friendCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
                <View style={styles.friendAvatarWrap}>
                  <Image source={{ uri: friend.avatar }} style={styles.friendAvatarImg} />
                  <View style={styles.friendOnlineDot} />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.friendNameText, { color: theme.textPrimary }]}>{friend.name || friend.username}</Text>
                    {friend.badge && (
                      <View style={[styles.badgePill, { backgroundColor: 'rgba(255, 85, 0, 0.2)' }]}>
                        <Text style={[styles.badgePillText, { color: friend.badgeColor || '#FF5500' }]}>{friend.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.friendRankText, { color: theme.textSecondary }]}>{friend.rank || 'Gamer'}</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => alert(`Invite sent to ${friend.name || friend.username}!`)}
                  style={styles.inviteBtn}
                >
                  <Text style={styles.inviteBtnText}>Invite</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
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
    paddingBottom: 320,
  },
  heroCenterBlock: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#FF5500',
    padding: 3,
    position: 'relative',
    marginBottom: 12,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#070C1B',
  },
  userNameText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  proCompetitorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proCompetitorText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  editProfileBtn: {
    flex: 1,
    backgroundColor: '#FF5500',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5500',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  editProfileText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  walletBtn: {
    flex: 1,
    backgroundColor: 'rgba(15, 25, 45, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  statsGridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCardBox: {
    flex: 1,
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.15)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBigVal: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  statSubLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  streakInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBigVal: {
    color: '#00E5FF',
    fontSize: 22,
    fontWeight: '900',
  },
  streakSubLabel: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  friendsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  friendsTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  onlineCountText: {
    color: '#FF5500',
    fontSize: 12,
    fontWeight: '800',
  },
  friendsList: {
    gap: 12,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 14,
  },
  friendAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    position: 'relative',
  },
  friendAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  friendOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#070C1B',
  },
  friendNameText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: '900',
  },
  friendRankText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  inviteBtn: {
    backgroundColor: '#FF5500',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
  },
  inviteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
