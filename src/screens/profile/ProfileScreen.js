import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, StatusBar, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Flame, CheckCircle2, Search, UserPlus, Check } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getStreakInfo } from '../../utils/recordGameStreak';
import { resolveAvatarSource } from '../../utils/avatarPresets';
import { referral, leaderboard } from '../../services/api';
import { formatGP } from '../../utils/gamePower';

export default function ProfileScreen({ navigation }) {
  const { userProfile, updateProfileData, refreshProfile } = useAuth();
  const { theme, isDark } = useTheme();
  const streakInfo = getStreakInfo(userProfile);
  const userName = userProfile?.displayName || userProfile?.fullName || userProfile?.name || (userProfile?.username ? `@${userProfile.username}` : '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [communityUsers, setCommunityUsers] = useState([]);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [followedUids, setFollowedUids] = useState(() => new Set(userProfile?.followingList || []));

  // Sync followedUids whenever userProfile updates
  useEffect(() => {
    if (Array.isArray(userProfile?.followingList)) {
      setFollowedUids(new Set(userProfile.followingList));
    }
  }, [userProfile?.followingList]);

  // Refresh profile from server on mount & focus
  useEffect(() => {
    if (refreshProfile) refreshProfile().catch(() => {});
  }, [refreshProfile]);

  // Helper to merge lists of players deduplicating by uid/id
  const mergePlayers = useCallback((baseList, ...extraLists) => {
    const map = new Map();
    const currentUid = userProfile?.uid;

    const addPlayer = (item) => {
      if (!item) return;
      const uid = item.uid || item.id;
      if (!uid || uid === currentUid) return;

      const existing = map.get(uid);
      const displayName = item.displayName || item.name || item.username || existing?.displayName || '';
      const username = item.username || (displayName ? displayName.replace(/\s+/g, '').toLowerCase() : '') || existing?.username || '';
      const avatar = item.avatar || item.avatarUrl || existing?.avatar || null;
      const plays = Number(item.gamesPlayed ?? item.plays ?? existing?.gamesPlayed ?? 0);
      const wins = Number(item.wins ?? item.gamesWon ?? existing?.wins ?? 0);
      const gp = item.gp != null
        ? Number(item.gp)
        : (existing?.gp != null
          ? existing.gp
          : (plays > 0
            ? Math.min(100, Math.max(10, Math.round(100 * (0.75 * (wins / plays) + 0.25 * Math.min(1, Math.log10(plays + 1) / 3)))))
            : 35));

      map.set(uid, {
        uid,
        id: uid,
        displayName,
        name: displayName,
        username,
        avatar,
        avatarUrl: avatar,
        gp,
        streak: item.streak ?? existing?.streak ?? 0,
        gamesPlayed: plays,
        wins,
      });
    };

    (baseList || []).forEach(addPlayer);
    extraLists.forEach((list) => (list || []).forEach(addPlayer));
    return Array.from(map.values());
  }, [userProfile?.uid]);

  // Load real community players directly from database and active leaderboards
  const loadAllCommunity = useCallback(async () => {
    setLoadingCommunity(true);
    try {
      const [refRes, dailyRes, weeklyRes] = await Promise.allSettled([
        referral.searchUsers(''),
        leaderboard.get('Daily'),
        leaderboard.get('Weekly'),
      ]);

      const refList = refRes.status === 'fulfilled'
        ? (Array.isArray(refRes.value?.data) ? refRes.value.data : (Array.isArray(refRes.value) ? refRes.value : []))
        : [];
      const dailyList = dailyRes.status === 'fulfilled'
        ? (Array.isArray(dailyRes.value?.data) ? dailyRes.value.data : (Array.isArray(dailyRes.value) ? dailyRes.value : []))
        : [];
      const weeklyList = weeklyRes.status === 'fulfilled'
        ? (Array.isArray(weeklyRes.value?.data) ? weeklyRes.value.data : (Array.isArray(weeklyRes.value) ? weeklyRes.value : []))
        : [];

      const combined = mergePlayers(refList, dailyList, weeklyList);
      setCommunityUsers(combined);
    } catch {
      // Keep existing list
    } finally {
      setLoadingCommunity(false);
    }
  }, [mergePlayers]);

  useEffect(() => {
    loadAllCommunity();
  }, [loadAllCommunity]);

  useEffect(() => {
    if (!navigation) return;
    const unsubscribe = navigation.addListener('focus', () => {
      if (refreshProfile) refreshProfile().catch(() => {});
      loadAllCommunity();
    });
    return unsubscribe;
  }, [navigation, refreshProfile, loadAllCommunity]);

  // Search real users in database and active leaderboard
  useEffect(() => {
    const rawQ = searchQuery.trim();
    const cleanQ = rawQ.replace(/^@+/, '').trim().toLowerCase();
    if (!cleanQ) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Instantly filter existing community & leaderboard players
    const instantMatches = communityUsers.filter((u) => {
      const uName = (u.username || '').toLowerCase();
      const dName = (u.displayName || u.name || '').toLowerCase();
      return uName.includes(cleanQ) || dName.includes(cleanQ);
    });
    setSearchResults(instantMatches);

    let cancelled = false;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await referral.searchUsers(cleanQ);
        if (!cancelled) {
          const serverList = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
          const merged = mergePlayers(instantMatches, serverList);
          setSearchResults(merged);
        }
      } catch {
        // Keep instant matches
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, communityUsers, mergePlayers]);

  const toggleFollow = useCallback((person) => {
    const pUid = person.uid || person.id;
    if (!pUid) return;
    const isCurrentlyFollowing = followedUids.has(pUid);
    const nextSet = new Set(followedUids);
    const currentFollowers = Number(userProfile?.followersCount ?? 0);
    const currentFollowing = Number(userProfile?.followingCount ?? 0);

    if (isCurrentlyFollowing) {
      nextSet.delete(pUid);
      setFollowedUids(nextSet);
      updateProfileData({
        followersCount: Math.max(0, currentFollowers - 1),
        followingCount: Math.max(0, currentFollowing - 1),
        followingList: Array.from(nextSet),
      }).catch(() => {});
    } else {
      nextSet.add(pUid);
      setFollowedUids(nextSet);
      updateProfileData({
        followersCount: currentFollowers + 1,
        followingCount: currentFollowing + 1,
        followingList: Array.from(nextSet),
      }).catch(() => {});
    }
  }, [followedUids, userProfile, updateProfileData]);

  const cleanQ = searchQuery.trim().replace(/^@+/, '').trim();
  const displayedUsers = cleanQ ? searchResults : communityUsers;

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
              source={resolveAvatarSource(userProfile?.avatar)}
              style={styles.avatarImg}
            />
            <View style={styles.onlineDot} />
          </View>

          <Text style={[styles.userNameText, { color: theme.textPrimary }]}>
            {userProfile?.displayName || userProfile?.fullName || userProfile?.name || (userProfile?.username ? `@${userProfile.username}` : '')}
          </Text>
          {Boolean(
            userProfile?.username &&
            (userProfile?.displayName || userProfile?.fullName || userProfile?.name) &&
            userProfile.username.toLowerCase() !== String(userProfile?.displayName || userProfile?.fullName || userProfile?.name).toLowerCase()
          ) && (
            <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '700', marginTop: 4 }}>
              @{userProfile.username.replace(/^@+/, '')}
            </Text>
          )}
        </View>

        {/* Action Buttons (Edit Profile & Wallet) */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('EditProfile')}
            style={[styles.editProfileBtn, { flex: 1 }]}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>

          {/* Wallet page commented out
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('WalletTab')}
            style={[styles.walletBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}
          >
            <Text style={[styles.walletBtnText, { color: theme.textPrimary }]}>Wallet</Text>
          </TouchableOpacity>
          */}
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

          <View
            style={[
              styles.statCardBox,
              {
                backgroundColor: theme.cardBg,
                borderColor: streakInfo.isActive
                  ? 'rgba(16, 185, 129, 0.4)'
                  : (streakInfo.isAtRisk ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)'),
              },
            ]}
          >
            <View style={styles.streakInlineRow}>
              <Flame
                size={16}
                color={streakInfo.isActive ? '#10B981' : (streakInfo.isAtRisk ? '#F59E0B' : '#EF4444')}
                  fill={streakInfo.isActive ? '#10B981' : (streakInfo.isAtRisk ? '#F59E0B' : 'none')}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.streakBigVal,
                  {
                    color: streakInfo.isActive
                      ? '#10B981'
                      : (streakInfo.isAtRisk ? '#F59E0B' : '#EF4444'),
                    fontSize: 16,
                  },
                ]}
              >
                {streakInfo.dayText}
              </Text>
            </View>
            <Text
              style={[
                styles.streakSubLabel,
                { color: streakInfo.isActive ? '#10B981' : (streakInfo.isAtRisk ? '#F59E0B' : '#EF4444') },
              ]}
            >
              {streakInfo.statusText.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Game Power (GP) & Value Points (VP) Row */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
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

        {/* Match Records & Performance Card */}
        {(() => {
          const w = Number(userProfile?.gamesWon ?? userProfile?.wins ?? 0);
          const l = Number(userProfile?.gamesLost ?? userProfile?.losses ?? 0);
          const p = Number(userProfile?.gamesPlayed ?? (w + l));
          const wr = p > 0 ? Math.round((w / p) * 100) : 0;
          return (
            <View
              style={{
                marginVertical: 8,
                backgroundColor: theme.cardBg,
                borderColor: theme.cardBorderSubtle,
                borderWidth: 1,
                borderRadius: 16,
                padding: 14,
              }}
            >
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10 }}>
                MATCH PERFORMANCE
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '900' }}>{p}</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '700', marginTop: 2 }}>PLAYED</Text>
                </View>
                <View style={{ width: 1, height: 24, backgroundColor: theme.inputBorder }} />
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: '#10B981', fontSize: 18, fontWeight: '900' }}>{w}</Text>
                  <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700', marginTop: 2 }}>WON</Text>
                </View>
                <View style={{ width: 1, height: 24, backgroundColor: theme.inputBorder }} />
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: '900' }}>{l}</Text>
                  <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: '700', marginTop: 2 }}>LOST</Text>
                </View>
                <View style={{ width: 1, height: 24, backgroundColor: theme.inputBorder }} />
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: '#00E5FF', fontSize: 18, fontWeight: '900' }}>{wr}%</Text>
                  <Text style={{ color: '#00E5FF', fontSize: 10, fontWeight: '700', marginTop: 2 }}>WIN RATE</Text>
                </View>
              </View>
            </View>
          );
        })()}

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
            placeholder="Search username or name"
            placeholderTextColor={theme.textMuted}
          />
          {isSearching && <ActivityIndicator size="small" color="#00E5FF" />}
        </View>

        {/* Active Friends List Section */}
        <View style={styles.friendsSectionHeader}>
          <Text style={[styles.friendsTitle, { color: theme.textSecondary }]}>
            {searchQuery.trim() ? 'SEARCH RESULTS' : 'COMMUNITY PLAYERS'}
          </Text>
          <Text style={styles.onlineCountText}>{displayedUsers.length} Players</Text>
        </View>

        <View style={styles.friendsList}>
          {displayedUsers.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '600' }}>
                {searchQuery.trim() ? `No player found matching "${searchQuery}"` : (loadingCommunity ? 'Loading players from database...' : 'No other players registered yet.')}
              </Text>
            </View>
          ) : (
            displayedUsers.map((person) => {
              const pUid = person.uid || person.id;
              const isFollowed = followedUids.has(pUid);
              const pName = person.displayName || person.name || '';
              const pUsername = person.username || '';
              const pGp = person.gp != null ? person.gp : (person.gamePower || 0);

              const primaryTitle = pName || (pUsername ? `@${pUsername.replace(/^@+/, '')}` : 'Player');
              const showSubtitle = Boolean(pUsername && pName && pUsername.toLowerCase() !== pName.toLowerCase());

              return (
                <View key={pUid} style={[styles.friendCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
                  <View style={styles.friendAvatarWrap}>
                    <Image source={resolveAvatarSource(person.avatar || person.avatarUrl)} style={styles.friendAvatarImg} />
                    <View style={styles.friendOnlineDot} />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.friendNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                      {primaryTitle}
                    </Text>
                    {showSubtitle && (
                      <Text style={[styles.friendRankText, { color: theme.textSecondary }]}>
                        @{pUsername.replace(/^@+/, '')}
                      </Text>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <View style={styles.gpBadge}>
                        <Text style={styles.gpBadgeText}>⚡ {pGp} GP</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => toggleFollow(person)}
                    style={[styles.followBtn, isFollowed ? styles.followingBtn : styles.followBtnActive]}
                  >
                    <Text style={[styles.followBtnText, isFollowed ? styles.followingBtnText : styles.followBtnActiveText]}>
                      {isFollowed ? 'Following ✓' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
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
    marginBottom: 10,
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
  gpBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gpBadgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '900',
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
  },
  followBtnActive: {
    backgroundColor: '#10B981',
  },
  followBtnActiveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  followingBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  followingBtnText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '800',
  },
});
