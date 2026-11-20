import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, StatusBar, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Flame, CheckCircle2, Search, UserPlus, Check } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getStreakInfo } from '../../utils/recordGameStreak';
import { resolveAvatarSource } from '../../utils/avatarPresets';
import { referral, leaderboard } from '../../services/api';
import { fetchAllPlatformPlayers } from '../../utils/platformPlayers';
import { formatGP } from '../../utils/gamePower';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [listFilter, setListFilter] = useState('all'); // 'all' | 'following' | 'followers'
  const [followedUids, setFollowedUids] = useState(() => new Set(Array.isArray(userProfile?.followingList) ? userProfile.followingList : []));
  const [followersUids, setFollowersUids] = useState(() => new Set());

  // Sync per-user following & followers lists from storage
  useEffect(() => {
    const uid = userProfile?.uid;
    if (!uid) {
      setFollowedUids(new Set());
      setFollowersUids(new Set());
      return;
    }
    Promise.all([
      AsyncStorage.getItem(`@gamearn_following_v2_${uid}`),
      AsyncStorage.getItem(`@gamearn_followers_list_v2_${uid}`),
      AsyncStorage.getItem('@gamearn_community_users_cache'),
    ]).then(([rawFollowing, rawFollowers, cachedUsersRaw]) => {
      if (rawFollowing !== null) {
        try {
          const list = JSON.parse(rawFollowing);
          if (Array.isArray(list)) {
            setFollowedUids(new Set(list.filter((id) => id && id !== uid)));
          }
        } catch { }
      } else if (Array.isArray(userProfile?.followingList)) {
        setFollowedUids(new Set(userProfile.followingList.filter((id) => id && id !== uid)));
      } else {
        setFollowedUids(new Set());
      }

      if (rawFollowers !== null) {
        try {
          const fList = JSON.parse(rawFollowers);
          if (Array.isArray(fList)) {
            setFollowersUids(new Set(fList.filter((id) => id && id !== uid)));
          }
        } catch { }
      }

      if (cachedUsersRaw) {
        try {
          const parsedUsers = JSON.parse(cachedUsersRaw);
          if (Array.isArray(parsedUsers) && parsedUsers.length) {
            setCommunityUsers(parsedUsers.filter((u) => (u.uid || u.id) !== uid));
            setLoadingCommunity(false);
          }
        } catch { }
      }
    });
  }, [userProfile?.uid]);

  // Refresh profile from server on mount & focus
  useEffect(() => {
    if (refreshProfile) refreshProfile().catch(() => { });
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
            ? Math.min(100, Math.max(0, Math.round(100 * (0.75 * (wins / plays) + 0.25 * Math.min(1, Math.log10(plays + 1) / 3)))))
            : 0));

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
    try {
      const combined = await fetchAllPlatformPlayers({ excludeUid: userProfile?.uid });
      if (combined.length > 0) {
        setCommunityUsers(combined);
      }
    } catch {
      // Keep existing list
    } finally {
      setLoadingCommunity(false);
    }
  }, [userProfile?.uid]);

  useEffect(() => {
    loadAllCommunity();
  }, [loadAllCommunity]);

  useEffect(() => {
    if (!navigation) return;
    const unsubscribe = navigation.addListener('focus', () => {
      if (refreshProfile) refreshProfile().catch(() => { });
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

  const handleFollow = useCallback(async (person) => {
    const pUid = person.uid || person.id;
    const uid = userProfile?.uid;
    if (!pUid || !uid || pUid === uid) return;

    const isCurrentlyFollowed = followedUids.has(pUid);
    const nextSet = new Set(followedUids);
    if (isCurrentlyFollowed) {
      nextSet.delete(pUid);
    } else {
      nextSet.add(pUid);
    }
    setFollowedUids(nextSet);

    const followingArr = Array.from(nextSet);
    const newFollowingCount = followingArr.length;

    try {
      await AsyncStorage.setItem(`@gamearn_following_v2_${uid}`, JSON.stringify(followingArr));

      // Update target player's followers list and count
      const targetFollowerListKey = `@gamearn_followers_list_v2_${pUid}`;
      const targetFollowerCountKey = `@gamearn_permanent_followers_${pUid}`;
      const [rawTargetList, rawTargetCount] = await Promise.all([
        AsyncStorage.getItem(targetFollowerListKey),
        AsyncStorage.getItem(targetFollowerCountKey),
      ]);
      const targetSet = new Set(rawTargetList ? JSON.parse(rawTargetList) : []);
      if (isCurrentlyFollowed) {
        targetSet.delete(uid);
      } else {
        targetSet.add(uid);
      }
      const nextTargetFollowersArr = Array.from(targetSet);
      const baseCount = rawTargetCount ? Number(JSON.parse(rawTargetCount)) || 0 : Number(person.followersCount || 0);
      const nextTargetCount = Math.max(
        nextTargetFollowersArr.length,
        isCurrentlyFollowed ? Math.max(0, baseCount - 1) : baseCount + 1
      );
      await Promise.all([
        AsyncStorage.setItem(targetFollowerListKey, JSON.stringify(nextTargetFollowersArr)),
        AsyncStorage.setItem(targetFollowerCountKey, JSON.stringify(nextTargetCount)),
      ]);

      if (!isCurrentlyFollowed) {
        // Post notification to the person followed: "@username followed you"
        const senderRaw = userProfile?.username || userProfile?.displayName || userProfile?.name || 'A player';
        const cleanSender = String(senderRaw).replace(/^@+/, '');
        const notif = {
          id: `follow_${uid}_${pUid}`,
          type: 'follow',
          title: 'New Follower',
          message: `@${cleanSender} followed you`,
          fromUser: cleanSender,
          fromUid: uid,
          createdAt: Date.now(),
          read: false,
        };

        const keyTarget = `@gamearn_notifications_${pUid}`;
        const tRaw = await AsyncStorage.getItem(keyTarget);
        const tList = tRaw ? JSON.parse(tRaw) : [];
        const filteredT = (Array.isArray(tList) ? tList : []).filter((n) => n?.id !== notif.id);
        filteredT.unshift(notif);
        await AsyncStorage.setItem(keyTarget, JSON.stringify(filteredT.slice(0, 50)));
      }
    } catch (e) {
      console.log('Follow storage error:', e);
    }

    updateProfileData({
      followingCount: newFollowingCount,
      followingList: followingArr,
    }).catch(() => { });
  }, [followedUids, userProfile, updateProfileData]);

  const cleanQ = searchQuery.trim().replace(/^@+/, '').trim();
  const baseUsers = cleanQ ? searchResults : communityUsers;
  const displayedUsers = baseUsers.filter((u) => {
    const pUid = u.uid || u.id;
    if (listFilter === 'following') return followedUids.has(pUid);
    if (listFilter === 'followers') return followersUids.has(pUid);
    return true;
  });
  const effectiveFollowersCount = followersUids.size;
  const effectiveFollowingCount = followedUids.size;

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
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setListFilter((prev) => (prev === 'followers' ? 'all' : 'followers'))}
            style={[
              styles.statCardBox,
              {
                backgroundColor: theme.cardBg,
                borderColor: listFilter === 'followers' ? '#00E5FF' : theme.cardBorderSubtle,
              },
            ]}
          >
            <Text style={[styles.statBigVal, { color: theme.textPrimary }]}>{effectiveFollowersCount}</Text>
            <Text style={[styles.statSubLabel, { color: listFilter === 'followers' ? '#00E5FF' : theme.textSecondary }]}>FOLLOWERS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setListFilter((prev) => (prev === 'following' ? 'all' : 'following'))}
            style={[
              styles.statCardBox,
              {
                backgroundColor: theme.cardBg,
                borderColor: listFilter === 'following' ? '#00E5FF' : theme.cardBorderSubtle,
              },
            ]}
          >
            <Text style={[styles.statBigVal, { color: theme.textPrimary }]}>{effectiveFollowingCount}</Text>
            <Text style={[styles.statSubLabel, { color: listFilter === 'following' ? '#00E5FF' : theme.textSecondary }]}>FOLLOWING</Text>
          </TouchableOpacity>

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

        {/* Filter Tabs: All Players / Following / Followers */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 4 }}>
          {[
            { key: 'all', label: `All Players (${communityUsers.length})` },
            { key: 'following', label: `Following (${effectiveFollowingCount})` },
            { key: 'followers', label: `Followers (${effectiveFollowersCount})` },
          ].map((tab) => {
            const active = listFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.85}
                onPress={() => setListFilter(tab.key)}
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  paddingHorizontal: 8,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: active ? '#00E5FF' : theme.cardBorderSubtle,
                  backgroundColor: active ? 'rgba(0, 229, 255, 0.14)' : theme.cardBg,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: active ? '#00E5FF' : theme.textSecondary,
                    fontSize: 11,
                    fontWeight: '800',
                  }}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Active Friends List Section */}
        <View style={styles.friendsSectionHeader}>
          <Text style={[styles.friendsTitle, { color: theme.textSecondary }]}>
            {searchQuery.trim()
              ? 'SEARCH RESULTS'
              : listFilter === 'following'
                ? 'PLAYERS YOU FOLLOW'
                : listFilter === 'followers'
                  ? 'PLAYERS FOLLOWING YOU'
                  : 'COMMUNITY PLAYERS'}
          </Text>
          <Text style={styles.onlineCountText}>{displayedUsers.length} Players</Text>
        </View>

        <View style={styles.friendsList}>
          {displayedUsers.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '600' }}>
                {searchQuery.trim()
                  ? `No player found matching "${searchQuery}"`
                  : listFilter === 'following'
                    ? 'You are not following any players yet. Tap Follow on any player to follow them!'
                    : listFilter === 'followers'
                      ? 'No players are following you yet.'
                      : loadingCommunity
                        ? 'Loading players from database...'
                        : 'No other players registered yet.'}
              </Text>
            </View>
          ) : (
            displayedUsers.map((person) => {
              const pUid = person.uid || person.id;
              const isFollowed = followedUids.has(pUid);
              const followsYou = followersUids.has(pUid);
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700' }}>
                        {person.gamesPlayed ?? person.plays ?? 0} Plays · {person.wins ?? 0} Wins
                      </Text>
                      <View style={styles.gpBadge}>
                        <Text style={styles.gpBadgeText}>⚡ {pGp} GP</Text>
                      </View>
                      {followsYou && (
                        <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.16)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '800' }}>Follows You</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleFollow(person)}
                    style={[styles.followBtn, isFollowed ? styles.followingBtn : styles.followBtnActive]}
                  >
                    <Text style={[styles.followBtnText, isFollowed ? styles.followingBtnText : styles.followBtnActiveText]}>
                      {isFollowed ? 'Unfollow' : (followsYou ? 'Follow Back' : 'Follow')}
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
