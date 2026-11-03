import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Trophy,
  Flame,
  Gamepad2,
  XCircle,
  BarChart3,
  Shield,
  ChevronRight,
  ArrowRight,
  Sparkles,
  LogOut,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { tournaments, leaderboard as leaderboardApi } from '../../services/api';
import { naira } from '../../config/appConfig';
import { clearActiveMatch } from '../../utils/activeMatch';
import { calculateGamePower, calculateValuePoints, formatGP, formatVP } from '../../utils/gamePower';
import {
  recordGameStreak,
  getWinStreakInfo,
  getGameWinStreakState,
  WIN_STREAK_TIERS,
} from '../../utils/recordGameStreak';
import { checkAndTriggerVp5Notification } from '../../utils/vpNotification';

export default function GameResultScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { userProfile, updateProfileData, refreshProfile } = useAuth();

  const {
    isWinner = true,
    isDraw = false,
    serverConfirmed = false,
    completionReason = 'normal',
    myScore = null,
    opponentScore = null,
    opponentName = 'Oba 👑',
    opponentAvatar = null,
    gameId = 'whot',
    gameName = 'Wọ́t Game',
    targetScreen = 'WhotGame',
    stake = 250,
    matchSettings = {},
  } = route.params || {};

  const [myTournaments, setMyTournaments] = useState([]);
  const [availableTournaments, setAvailableTournaments] = useState([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [activeStandings, setActiveStandings] = useState(null);
  const [previewStandings, setPreviewStandings] = useState(null);
  const [claimingStreak, setClaimingStreak] = useState(false);
  const [streakClaimMessage, setStreakClaimMessage] = useState(null);

  const recordedRef = React.useRef(false);

  // The per-game careers map (`userProfile.gameStats`) is keyed by the backend
  // game enum ("draughts"), but the UI route passes "draft" for Draughts. Map
  // UI ids to their stats bucket so the right career record is read/written.
  const GAME_STATS_KEY = { draft: 'draughts', checkers: 'draughts', draught: 'draughts', draughts: 'draughts' };
  const statsKey = GAME_STATS_KEY[String(gameId).toLowerCase()] || gameId;

  useEffect(() => {
    // Always clear active match session when game result screen mounts!
    clearActiveMatch().catch(() => {});

    if (recordedRef.current) return;
    recordedRef.current = true;

    // Immediately record match outcome to PostgreSQL so the leaderboard updates without delay
    const outcome = isWinner ? 'win' : (isDraw ? 'draw' : 'loss');
    leaderboardApi.recordCompletion(statsKey, outcome, completionReason).catch(() => {});

    if (updateProfileData && userProfile) {
      const currentWins = Number(userProfile?.wins ?? userProfile?.gamesWon ?? 0);
      const currentLosses = Number(userProfile?.losses ?? userProfile?.gamesLost ?? 0);
      const currentPlayed = Number(userProfile?.gamesPlayed ?? (currentWins + currentLosses));

      const newWins = isWinner ? currentWins + 1 : currentWins;
      const newLosses = !isWinner ? currentLosses + 1 : currentLosses;
      const newPlayed = Math.max(currentPlayed + 1, newWins + newLosses);

      // Per-Game stats calculation (e.g. Draughts/Checkers, Ludo, Ayo, Whot)
      const existingGameStats = userProfile?.gameStats || {};
      const currentThisGame = existingGameStats[statsKey] || existingGameStats.draft || existingGameStats.draughts || { gamesPlayed: 0, wins: 0, losses: 0, winStreak: 0, claimedWinStreakTier: 0 };

      const thisGamePlayed = Number(currentThisGame.gamesPlayed || 0) + 1;
      const thisGameWins = Number(currentThisGame.wins || 0) + (isWinner ? 1 : 0);
      const thisGameLosses = Number(currentThisGame.losses || 0) + (!isWinner ? 1 : 0);

      // Consecutive win streak for THIS specific game:
      // Increments on win, resets to 0 on loss, preserved on draw
      const currentThisGameWinStreak = Number(currentThisGame.winStreak || 0);
      const newThisGameWinStreak = isWinner ? currentThisGameWinStreak + 1 : (isDraw ? currentThisGameWinStreak : 0);
      const claimedTier = Number(currentThisGame.claimedWinStreakTier || 0);

      const isCheckers = statsKey === 'draughts' || statsKey === 'draft' || statsKey === 'checkers';
      const updatedThisGame = {
        ...currentThisGame,
        gamesPlayed: thisGamePlayed,
        wins: thisGameWins,
        losses: thisGameLosses,
        winStreak: newThisGameWinStreak,
        claimedWinStreakTier: claimedTier,
      };

      const updatedGameStats = {
        ...existingGameStats,
        [statsKey]: updatedThisGame,
      };

      if (isCheckers) {
        updatedGameStats.draft = updatedThisGame;
        updatedGameStats.draughts = updatedThisGame;
      }

      // Calculate Game Power (GP) dynamically using official formula
      const newGp = calculateGamePower(newPlayed, newWins, newLosses);

      const userBalance = Number(userProfile?.walletBalance ?? userProfile?.balance ?? userProfile?.valuePoints ?? 0);
      const calculatedVp = calculateValuePoints(userBalance, newPlayed, newWins);
      const currentStoredVp = Number(userProfile?.valuePoints ?? userProfile?.vp ?? 0);
      const newVp = Math.max(currentStoredVp, calculatedVp);

      updateProfileData({
        wins: newWins,
        gamesWon: newWins,
        losses: newLosses,
        gamesLost: newLosses,
        gamesPlayed: newPlayed,
        gameStats: updatedGameStats,
        gamePower: newGp,
        gp: newGp,
        gpText: formatGP(newGp),
        valuePoints: newVp,
        vp: newVp,
        vpText: formatVP(newVp),
      }).catch((err) => console.log('Notice updating result stats:', err));

      // Record Win Streak: increments if isWinner=true, resets to 0 if isWinner=false
      recordGameStreak(updateProfileData, userProfile, isWinner).catch(() => {});
    }

    if (serverConfirmed) {
      refreshProfile().catch(() => {});
    }
  }, []);

  const gameWinStreak = getGameWinStreakState(userProfile, statsKey);

  const handleClaimWinStreak = async (tierToClaim) => {
    if (!tierToClaim || claimingStreak) return;
    setClaimingStreak(true);
    setStreakClaimMessage(null);
    try {
      const reward = Number(tierToClaim.rewardVp);
      const currentVp = Number(userProfile?.valuePoints ?? userProfile?.vp ?? 0);
      const newVp = Math.round((currentVp + reward) * 10) / 10;

      const existingGameStats = userProfile?.gameStats || {};
      const thisGameStats = existingGameStats[statsKey] || existingGameStats.draft || existingGameStats.draughts || {};

      const updatedThisGame = {
        ...thisGameStats,
        claimedWinStreakTier: tierToClaim.tier,
      };

      const isCheckers = statsKey === 'draughts' || statsKey === 'draft' || statsKey === 'checkers';
      const updatedStats = {
        ...existingGameStats,
        [statsKey]: updatedThisGame,
      };
      if (isCheckers) {
        updatedStats.draft = updatedThisGame;
        updatedStats.draughts = updatedThisGame;
      }

      await updateProfileData({
        valuePoints: newVp,
        vp: newVp,
        vpText: formatVP(newVp),
        gameStats: updatedStats,
      });

      const nextTier = WIN_STREAK_TIERS[tierToClaim.tier];
      if (nextTier) {
        setStreakClaimMessage(`🎉 Claimed +${reward} VP! Unlocked next target: ${nextTier.label} (${nextTier.rewardVp} VP)`);
      } else {
        setStreakClaimMessage(`🎉 Claimed +${reward} VP! You completed all 1-10 streak milestones! 🏆`);
      }

      if (newVp >= 10) {
        checkAndTriggerVp5Notification(
          newVp,
          userProfile?.uid,
          userProfile?.username || userProfile?.displayName || userProfile?.name
        );
      }
    } catch (err) {
      console.log('Error claiming win streak reward:', err?.message || err);
      Alert.alert('Notice', 'Could not claim streak reward at this time.');
    } finally {
      setClaimingStreak(false);
    }
  };

  // Per-game specific stats for display on this result screen
  const currentGameStats = userProfile?.gameStats?.[statsKey] || userProfile?.gameStats?.draft || userProfile?.gameStats?.draughts || {};
  const thisGamePlayed = Number(currentGameStats.gamesPlayed ?? 0);
  const thisGameWins = Number(currentGameStats.wins ?? 0);
  const thisGameLosses = Number(currentGameStats.losses ?? 0);
  const winRate = thisGamePlayed > 0 ? Math.round((thisGameWins / thisGamePlayed) * 100) : 0;

  const streakCount = Number(userProfile?.streak ?? userProfile?.currentStreak ?? 0);
  const currentGp = Number(userProfile?.gamePower ?? userProfile?.gp ?? 0);

  // Streak node progress (1, 2, 3 wins)
  const streakStep = (streakCount % 3) || (streakCount > 0 ? 3 : 0);
  const winsNeededForReward = streakStep === 3 ? 0 : 3 - streakStep;

  useEffect(() => {
    let active = true;
    async function fetchTournaments() {
      try {
        const [myRes, listRes] = await Promise.allSettled([
          tournaments.my(),
          tournaments.list(gameId),
        ]);

        if (!active) return;

        if (myRes.status === 'fulfilled') {
          const rawMy = myRes.value?.data || myRes.value || [];
          setMyTournaments(Array.isArray(rawMy) ? rawMy : []);
        }

        if (listRes.status === 'fulfilled') {
          const rawList = listRes.value?.data || listRes.value || [];
          setAvailableTournaments(Array.isArray(rawList) ? rawList : []);
        }
      } catch (err) {
        console.log('Error loading tournament impact:', err?.message || err);
      } finally {
        if (active) setLoadingTournaments(false);
      }
    }

    fetchTournaments();

    return () => {
      active = false;
    };
  }, [gameId]);

  // Check if player is part of an active tournament for this game
  const [activeUserTour] = myTournaments.filter(
    (t) =>
      String(t.gameType).toLowerCase() === String(gameId).toLowerCase() &&
      ['registration_open', 'in_progress', 'live', 'pending', 'scheduled'].includes(
        String(t.status).toLowerCase()
      )
  );

  // Check available open tournament for prompt
  const [openTour] = availableTournaments.filter(
    (t) =>
      String(t.gameType).toLowerCase() === String(gameId).toLowerCase() &&
      ['registration_open', 'open', 'scheduled', 'live', 'in_progress'].includes(String(t.status).toLowerCase())
  );

  // Pull live standings for the player's active tournament (or the preview target)
  useEffect(() => {
    let active = true;
    const targetId = activeUserTour?.id;
    if (!targetId) return undefined;
    tournaments
      .standings(targetId)
      .then((res) => {
        if (active) setActiveStandings(res?.data || res || null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [activeUserTour?.id]);

  useEffect(() => {
    let active = true;
    const targetId = openTour?.id;
    if (!targetId) return undefined;
    tournaments
      .standings(targetId)
      .then((res) => {
        if (active) setPreviewStandings(res?.data || res || null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [openTour?.id]);

  const currentRank = (() => {
    if (!activeStandings?.ranked?.length) return null;
    const idx = activeStandings.ranked.findIndex((row) => String(row.uid || row.user_id || row.id) === String(userProfile?.uid));
    return idx >= 0 ? idx + 1 : null;
  })();

  const currentPoolKobo = activeStandings?.poolKobo ?? activeUserTour?.prizePoolKobo ?? null;
  const previewPoolKobo = previewStandings?.poolKobo ?? openTour?.prizePoolKobo ?? null;

  const handlePlayAgain = () => {
    const prevMatch = route.params?.matchSettings || matchSettings || {};
    if (serverConfirmed && prevMatch.mode === 'multiplayer') {
      navigation.replace('GameLobby', { gameId, gameType: gameId, gameName, targetScreen });
      return;
    }
    navigation.replace(targetScreen, {
      ...prevMatch,
      gameId,
      gameName,
      targetScreen,
      stake,
      resetKey: Date.now(),
    });
  };

  const handleExitGame = async () => {
    await clearActiveMatch();
    navigation.navigate('MainTabs');
  };

  const handleJoinTournament = (tourId) => {
    if (tourId) {
      navigation.navigate('TournamentDetails', { tourId });
    } else {
      navigation.navigate('MainTabs', { screen: 'TourTab' });
    }
  };

  return (
    <View style={[styles.screenRoot, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#070C1B" />
      <LinearGradient colors={['#091026', '#060919', '#040612']} style={StyleSheet.absoluteFillObject} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Victory / Defeat Header */}
        <View style={styles.headerSection}>
          <View style={styles.trophyWrap}>
            <View style={styles.trophyGlow} />
            <Text style={styles.trophyEmoji}>🏆</Text>
          </View>
          <Text style={styles.victoryTitle}>{isDraw ? 'MATCH DRAWN' : isWinner ? 'VICTORY!' : 'GAME OVER'}</Text>
          <Text style={styles.victorySub}>
            {completionReason === 'forfeit' ? (isWinner ? 'Opponent surrendered.' : 'Lost by surrender.') : isDraw ? 'An evenly matched game. Play again!' : isWinner ? 'Great Game! You played well. Keep it up!' : 'Good effort! Practice makes perfect!'}
          </Text>
        </View>

        {/* Player vs Opponent Match Card */}
        <View style={styles.matchVsCard}>
          {/* Left Player (You) */}
          <View
            style={[
              styles.playerBox,
              styles.playerBoxLeft,
              isWinner && styles.winnerHighlightBox,
            ]}
          >
            {isWinner && (
              <View style={styles.winnerTag}>
                <Text style={styles.winnerTagText}>👑 WINNER</Text>
              </View>
            )}
            <View style={[styles.avatarCircle, isWinner && styles.avatarCircleWinner]}>
              {userProfile?.photoURL || userProfile?.avatar ? (
                <Image source={{ uri: userProfile?.photoURL || userProfile?.avatar }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {(userProfile?.username || userProfile?.displayName || userProfile?.name || 'Y')[0].toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.playerName}>You</Text>
            {gameId !== 'whot' && myScore != null && completionReason !== 'forfeit' && <><Text style={styles.playerScore}>{myScore}</Text><Text style={styles.statLabel}>{gameId === 'ayo' ? 'Seeds scored' : 'Score'}</Text></>}
          </View>

          {/* Center VS Badge */}
          <View style={styles.vsCircle}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          {/* Right Player (Opponent) */}
          <View
            style={[
              styles.playerBox,
              styles.playerBoxRight,
              !isWinner && !isDraw && styles.winnerHighlightBox,
            ]}
          >
            {!isWinner && !isDraw && (
              <View style={styles.winnerTag}>
                <Text style={styles.winnerTagText}>👑 WINNER</Text>
              </View>
            )}
            <View style={[styles.avatarCircle, !isWinner && !isDraw && styles.avatarCircleWinner]}>
              {opponentAvatar ? (
                <Image source={{ uri: opponentAvatar }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: '#1E293B' }]}>
                  <Text style={[styles.avatarInitial, { color: '#00E5FF' }]}>👑</Text>
                </View>
              )}
            </View>
            <Text style={styles.playerName} numberOfLines={1}>
              {opponentName}
            </Text>
            {gameId !== 'whot' && opponentScore != null && completionReason !== 'forfeit' && <><Text style={styles.playerScore}>{opponentScore}</Text><Text style={styles.statLabel}>{gameId === 'ayo' ? 'Seeds scored' : 'Score'}</Text></>}
          </View>
        </View>


        {/* Per-Game Stats 4 Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Gamepad2 size={18} color="#00E5FF" style={{ marginBottom: 6 }} />
            <Text style={styles.statLabel}>Games Played</Text>
            <Text style={styles.statValue}>{thisGamePlayed}</Text>
          </View>

          <View style={styles.statBox}>
            <Trophy size={18} color="#F59E0B" style={{ marginBottom: 6 }} />
            <Text style={styles.statLabel}>Games Won</Text>
            <Text style={styles.statValue}>{thisGameWins}</Text>
          </View>

          <View style={styles.statBox}>
            <XCircle size={18} color="#EF4444" style={{ marginBottom: 6 }} />
            <Text style={styles.statLabel}>Games Lost</Text>
            <Text style={styles.statValue}>{thisGameLosses}</Text>
          </View>

          <View style={styles.statBox}>
            <BarChart3 size={18} color="#10B981" style={{ marginBottom: 6 }} />
            <Text style={styles.statLabel}>Win Rate</Text>
            <Text style={styles.statValue}>{winRate}%</Text>
          </View>
        </View>

        {/* Progressive Match Win Streak Card (Per-Game) */}
        {(() => {
          const { winStreak, claimedTier, activeTier, isCompletedAll, canClaim, winsNeeded } = gameWinStreak;
          const targetWins = activeTier ? activeTier.targetWins : 10;
          const progressPercent = Math.min(100, Math.max(0, Math.round((winStreak / targetWins) * 100)));

          return (
            <View style={styles.cardContainer}>
              {/* Header row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
                  <View style={[styles.gpShieldIcon, { backgroundColor: isWinner ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                    <Flame size={18} color={isWinner ? '#10B981' : '#EF4444'} fill={isWinner ? '#10B981' : 'none'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{gameName} Winning Streak</Text>
                    <Text style={styles.cardSub}>
                      {isWinner
                        ? `${winStreak} consecutive win${winStreak === 1 ? '' : 's'} in ${gameName}!`
                        : 'Streak reset to 0 on match loss'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.liveBadge, { backgroundColor: isWinner ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', borderColor: isWinner ? '#10B981' : '#EF4444' }]}>
                  <Text style={[styles.liveBadgeText, { color: isWinner ? '#10B981' : '#EF4444' }]}>
                    {isWinner ? `🔥 ${winStreak} WIN STREAK` : 'RESET TO 0'}
                  </Text>
                </View>
              </View>

              {/* Progressive Milestones Section */}
              {isCompletedAll ? (
                <View style={styles.streakCompletedBox}>
                  <Text style={styles.streakCompletedTitle}>🏆 All Streak Rewards Claimed!</Text>
                  <Text style={styles.streakCompletedSub}>
                    Grand Champion! You have conquered all consecutive win milestones (1-10) for {gameName}.
                  </Text>
                </View>
              ) : activeTier ? (
                <View style={styles.streakProgressBox}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={styles.streakTargetLabel}>
                      Current Milestone: <Text style={{ color: '#00E5FF', fontWeight: '900' }}>{activeTier.label}</Text>
                    </Text>
                    <View style={styles.rewardBadge}>
                      <Text style={styles.rewardBadgeText}>+{activeTier.rewardVp} VP</Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBarTrack}>
                    <LinearGradient
                      colors={['#10B981', '#00E5FF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <Text style={styles.gpSubText}>
                      {winStreak} / {activeTier.targetWins} Consecutive Wins ({progressPercent}%)
                    </Text>
                    {!canClaim && (
                      <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700' }}>
                        {winsNeeded} more win{winsNeeded === 1 ? '' : 's'} needed
                      </Text>
                    )}
                  </View>

                  {/* Claim Button when active target is reached */}
                  {canClaim && (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleClaimWinStreak(activeTier)}
                      disabled={claimingStreak}
                      style={styles.claimStreakBtn}
                    >
                      <LinearGradient
                        colors={['#10B981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.claimStreakBtnGrad}
                      >
                        {claimingStreak ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Trophy size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.claimStreakBtnText}>
                              Claim {activeTier.rewardVp} VP Reward
                            </Text>
                            <ArrowRight size={15} color="#FFFFFF" style={{ marginLeft: 6 }} />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  {streakClaimMessage && (
                    <View style={styles.streakSuccessNotice}>
                      <Text style={styles.streakSuccessText}>{streakClaimMessage}</Text>
                    </View>
                  )}

                  <Text style={styles.streakGatingHint}>
                    ⚡ Progressive: Claim {activeTier.shortLabel} to unlock the next milestone!
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })()}

        {/* Game Power (GP) Progress Bar */}
        <View style={styles.cardContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.gpShieldIcon}>
                <Shield size={18} color="#F59E0B" />
              </View>
              <Text style={styles.cardTitle}>Game Power</Text>
            </View>

          </View>

          {/* Progress Track */}
          <View style={styles.progressBarTrack}>
            <LinearGradient
              colors={['#00E5FF', '#0284C7']}
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(0, currentGp))}%` },
              ]}
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={styles.gpSubText}>{currentGp.toLocaleString()} / 100 GP</Text>
            <ChevronRight size={16} color="#64748B" />
          </View>
        </View>

        {/* TOURNAMENT IMPACT / STANDING PREVIEW SECTION */}
        <View style={styles.tournamentSectionCard}>
          {loadingTournaments ? (
            <ActivityIndicator size="small" color="#00E5FF" style={{ padding: 10 }} />
          ) : activeUserTour ? (
            /* Scenario A: User IS in an active tournament */
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Trophy size={16} color="#F59E0B" />
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                    Tournament Standing Impact
                  </Text>
                </View>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>LIVE TOURNAMENT</Text>
                </View>
              </View>

              <Text style={{ color: '#00E5FF', fontWeight: '800', fontSize: 12 }}>
                {activeUserTour.name || activeUserTour.title || `${gameName} Championship`}
              </Text>

              <View style={styles.tourImpactRow}>
                <View style={styles.impactBadge}>
                  <Text style={{ color: '#10B981', fontWeight: '900', fontSize: 12 }}>
                    {currentRank != null
                      ? isWinner
                        ? `🚀 Rank Up to #${currentRank}`
                        : `Current Standings: #${currentRank}`
                      : isWinner
                      ? '🚀 Win recorded — standings updating'
                      : 'Standings updating…'}
                  </Text>
                </View>
                <Text style={{ color: '#94A3B8', fontSize: 11 }}>{activeUserTour.currentParticipants || 0} players · Wins/plays ranked</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: 12 }}>
                  Prize Pool: {naira(activeUserTour.prizePool || currentPoolKobo || 0)}
                </Text>
                {activeStandings?.topWinners != null && (
                  <Text style={{ color: '#94A3B8', fontSize: 11 }}>Top {activeStandings.topWinners} pay</Text>
                )}
              </View>
            </View>
          ) : (
            /* Scenario B: User is NOT in a tournament for this game */
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Sparkles size={16} color="#00E5FF" />
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                    Explore Tournaments
                  </Text>
                </View>
                <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: 11 }}>
                  🔥 Top Contender
                </Text>
              </View>

              <Text style={{ color: '#CBD5E1', fontSize: 11, lineHeight: 15 }}>
                {previewStandings?.ranked?.length ? (
                  <>
                    The leader has{' '}
                    <Text style={{ color: '#00E5FF', fontWeight: '900' }}>{previewStandings.ranked[0].wins || 0} wins</Text>{' '}
                    with{' '}
                    <Text style={{ color: '#00E5FF', fontWeight: '900' }}>{previewStandings.ranked[0].plays || 0}</Text>{' '}
                    plays. A win like this moves you up the ladder — join before registration closes.
                  </>
                ) : (
                  <>
                    This match does not change tournament standings. Join a tournament to compete.
                  </>
                )}
              </Text>
              {previewPoolKobo != null && (
                <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: 13 }}>
                  Pool to play for: {naira(openTour?.prizePool || previewPoolKobo || 0)}
                </Text>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleJoinTournament(openTour?.id)}
                style={styles.joinTourPromptBtn}
              >
                <Trophy size={15} color="#070C1B" style={{ flexShrink: 0, marginRight: 6 }} />
                <Text style={styles.joinTourPromptBtnText} numberOfLines={2}>
                  {openTour
                    ? `Join "${openTour.name || gameName}"${/tournament|championship/i.test(openTour?.name || '') ? '' : ' Tournament'}`
                    : 'Join Live Tournament 🏆'}
                </Text>
                <ArrowRight size={15} color="#070C1B" style={{ flexShrink: 0, marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Action CTA Buttons */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePlayAgain}
          style={styles.playAgainBtn}
        >
          <Text style={styles.playAgainBtnText}>Play Again</Text>
          <ChevronRight size={20} color="#070C1B" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleExitGame}
          style={styles.exitGameBtn}
        >
          <LogOut size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.exitGameBtnText}>Exit Game</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#070C1B',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  trophyWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 10,
  },
  trophyGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  trophyEmoji: {
    fontSize: 56,
  },
  victoryTitle: {
    color: '#FFD700',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(255, 215, 0, 0.4)',
    textShadowRadius: 10,
  },
  victorySub: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  matchVsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    position: 'relative',
  },
  playerBox: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  playerBoxLeft: {
    marginRight: 6,
  },
  playerBoxRight: {
    marginLeft: 6,
  },
  winnerHighlightBox: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  winnerTag: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  winnerTagText: {
    color: '#070C1B',
    fontSize: 10,
    fontWeight: '900',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 8,
  },
  avatarCircleWinner: {
    borderColor: '#00E5FF',
    borderWidth: 3,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  playerName: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  playerScore: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  vsCircle: {
    position: 'absolute',
    left: '50%',
    marginLeft: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#070C1B',
    borderWidth: 2,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  vsText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '900',
  },
  cardContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  cardSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  streakNodesTrack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nodeCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCircleActive: {
    backgroundColor: '#10B981',
  },
  nodeCheck: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  nodeLine: {
    width: 14,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  nodeLineActive: {
    backgroundColor: '#10B981',
  },
  rewardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  rewardTagText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '800',
    marginRight: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  gpShieldIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpGainText: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '900',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  gpSubText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  tournamentSectionCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
  },
  liveBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  liveBadgeText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '900',
  },
  tourImpactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  impactBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  joinTourPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00E5FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 6,
    minHeight: 46,
  },
  joinTourPromptBtnText: {
    color: '#070C1B',
    fontWeight: '900',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    flexShrink: 1,
    alignSelf: 'center',
  },
  playAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00E5FF',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 12,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  playAgainBtnText: {
    color: '#070C1B',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginRight: 4,
  },
  exitGameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.6)',
    borderRadius: 16,
    paddingVertical: 15,
    marginBottom: 16,
  },
  exitGameBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  streakProgressBox: {
    backgroundColor: 'rgba(11, 19, 43, 0.7)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    marginTop: 4,
  },
  streakTargetLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rewardBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  rewardBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '900',
  },
  claimStreakBtn: {
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  claimStreakBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  claimStreakBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  streakSuccessNotice: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  streakSuccessText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  streakGatingHint: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 8,
    fontStyle: 'italic',
  },
  streakCompletedBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  streakCompletedTitle: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  streakCompletedSub: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 15,
  },
});
