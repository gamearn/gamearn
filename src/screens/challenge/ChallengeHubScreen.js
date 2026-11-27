import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { ArrowLeft, Swords, Check, Trophy, RefreshCw } from 'lucide-react-native';
import BrandLogo from '../../components/BrandLogo';
import GAButton from '../../components/GAButton';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { challenges } from '../../services/api';
import { GamearnSocket } from '../../services/gamearnSocket';

// gameType -> how to navigate into that game's screen. gameId mirrors the
// GameLobbyScreen convention ('draft' -> draughts) so setup params match.
const GAME_BY_TYPE = {
  whot: { gameId: 'whot', targetScreen: 'WhotGame', name: 'Whot Naija' },
  ludo: { gameId: 'ludo', targetScreen: 'LudoGame', name: 'Ludo' },
  ayo: { gameId: 'ayo', targetScreen: 'AyoGame', name: 'Ayò' },
  draughts: { gameId: 'draft', targetScreen: 'DraughtsGame', name: 'Dráfù' },
};

export default function ChallengeHubScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { userProfile } = useAuth();

  // Set when the player arrives from a specific game's lobby: the hub then
  // shows only that game instead of asking again.
  const lockedGameType = GAME_BY_TYPE[route.params?.gameType] ? route.params.gameType : null;
  const routeGameType = lockedGameType || 'whot';

  const [tab, setTab] = useState(['open', 'mine', 'create'].includes(route.params?.tab) ? route.params.tab : 'open'); // open | mine | create
  const [openList, setOpenList] = useState([]);
  const [mineList, setMineList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [createGameType, setCreateGameType] = useState(routeGameType);
  const [creating, setCreating] = useState(false);
  const [opponentUsername, setOpponentUsername] = useState('');

  const sockRef = useRef(null);

  // Normalize the many shapes a list endpoint can return after apiClient has
  // already unwrapped the { success, data } envelope.
  const normalizeList = (value) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
      for (const key of ['challenges', 'data', 'items', 'list', 'open', 'mine']) {
        if (Array.isArray(value[key])) return value[key];
      }
    }
    return [];
  };

  const loadAll = useCallback(async (showError = false) => {
    const [openRes, mineRes] = await Promise.allSettled([challenges.list(lockedGameType), challenges.my()]);

    const openOk = openRes.status === 'fulfilled';
    const mineOk = mineRes.status === 'fulfilled';
    if (openOk) setOpenList(normalizeList(openRes.value));
    if (mineOk) {
      const mine = normalizeList(mineRes.value);
      setMineList(lockedGameType ? mine.filter((c) => c.gameType === lockedGameType) : mine);
    }

    if (!openOk || !mineOk) {
      const reason = !openOk
        ? openRes.reason?.message || 'Could not load open challenges'
        : mineRes.reason?.message || 'Could not load your challenges';
      setLoadError(reason);
      if (showError) Alert.alert('Could not load challenges', reason);
    } else {
      setLoadError(null);
    }
  }, [lockedGameType]);

  // A notification tap while the hub is already open only changes params.
  useEffect(() => {
    const t = route.params?.tab;
    if (['open', 'mine', 'create'].includes(t)) setTab(t);
    if (route.params?.refresh) loadAll();
  }, [route.params?.tab, route.params?.refresh, loadAll]);

  useEffect(() => {
    setLoading(true);
    loadAll().finally(() => setLoading(false));
    // Note: load failures are shown via the error banner (loadError state).

    const sock = new GamearnSocket({
      onConnected: () => {},
      onChallengeCreated: () => loadAll(),
      onChallengeAccepted: () => {
        loadAll();
      },
      // Someone sent me a direct request: refresh and tell me.
      onChallengeRequest: (p) => {
        loadAll();
        setTab('open');
        Alert.alert('Challenge request', `${p?.creatorName || 'A player'} wants to play you at ${GAME_BY_TYPE[p?.gameType]?.name || 'a game'}. Accept or decline it in the Open tab.`);
      },
      onMatchFound: (p) => {
        // Another player accepted MY challenge -> jump straight into the room.
        const mapped = GAME_BY_TYPE[p.gameType];
        if (!mapped) return;
        sockRef.current?.disconnect();
        sockRef.current = null;
        navigation.navigate(mapped.targetScreen, {
          mode: 'multiplayer',
          gameId: mapped.gameId,
          roomId: p.roomId,
          entryFee: 0,
          prizePool: 0,
          opponent: p.opponent,
          timer: '2m',
          aiDifficulty: 'auto',
          tokenCount: 4,
          playerColor: 'white',
          cardCount: 6,
          enableSpecialCards: true,
        });
      },
      onError: () => {},
    });
    sockRef.current = sock;
    sock.connect();
    return () => {
      sockRef.current?.disconnect();
      sockRef.current = null;
    };
  }, [loadAll, navigation]);

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('MainTabs');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const joinRoom = (p) => {
    const mapped = GAME_BY_TYPE[p.gameType];
    if (!mapped) {
      Alert.alert('Unsupported game', 'This challenge is for a game that is not available yet.');
      return;
    }
    const opts = p.options || {};
    navigation.navigate(mapped.targetScreen, {
      mode: 'multiplayer',
      gameId: mapped.gameId,
      roomId: p.roomId,
      entryFee: 0,
      prizePool: 0,
      opponent: p.opponent,
      timer: opts.timer || '2m',
      aiDifficulty: opts.aiDifficulty || 'auto',
      tokenCount: opts.tokenCount || 4,
      playerCount: opts.playerCount || 4,
      playerColor: opts.playerColor || 'white',
      cardCount: opts.cardCount || 6,
      enableSpecialCards: opts.enableSpecialCards ?? true,
      seedCount: opts.seedCount || 4,
    });
  };

  const acceptChallenge = async (ch) => {
    setBusyId(ch.id);
    try {
      const res = await challenges.accept(ch.id);
      const payload = res?.data ?? res;
      const room = payload?.room ?? payload;
      const matchPayload = payload?.payload ?? payload;
      joinRoom({
        gameType: matchPayload?.gameType ?? ch.gameType,
        roomId: matchPayload?.roomId ?? room?.roomId,
        entryFee: 0,
        prizePool: 0,
        opponent: matchPayload?.opponent ?? null,
        options: ch.options,
      });
    } catch (err) {
      Alert.alert('Accept failed', err?.message || 'Could not accept the challenge.');
    } finally {
      setBusyId(null);
    }
  };

  const declineChallenge = async (ch) => {
    setBusyId(ch.id);
    try {
      await challenges.decline(ch.id);
      await loadAll();
    } catch (err) {
      Alert.alert('Decline failed', err?.message || 'Could not decline the challenge.');
    } finally {
      setBusyId(null);
    }
  };

  const cancelChallenge = async (ch) => {
    setBusyId(ch.id);
    try {
      await challenges.cancel(ch.id);
      await loadAll();
    } catch (err) {
      Alert.alert('Cancel failed', err?.message || 'Could not cancel the challenge.');
    } finally {
      setBusyId(null);
    }
  };

  const create = async () => {
    if (!userProfile) {
      Alert.alert('Sign in required', 'Create an account to issue challenges.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    const targetName = opponentUsername.trim().replace(/^@+/, '');
    if (opponentUsername.trim() && targetName.length < 2) {
      Alert.alert('Check the username', 'Enter the full username of the player you want to challenge, or clear the field to post an open challenge.');
      return;
    }
    setCreating(true);
    try {
      const res = await challenges.create({
        gameType: createGameType,
        entryFeeKobo: 0,
        opponentUsername: targetName || undefined,
        options: {
          timer: '2m',
          aiDifficulty: 'auto',
          tokenCount: 4,
          playerColor: 'white',
          cardCount: 6,
          enableSpecialCards: true,
        },
      });
      // Optimistically insert the returned challenge so it appears immediately
      // even if the subsequent GET fails.
      const created = res?.data ?? res;
      if (created?.id) setMineList((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
      if (targetName) {
        Alert.alert('Request Sent', `Your ${GAME_BY_TYPE[createGameType].name} request was sent to @${targetName}. You will be taken into the room when they accept.`);
      } else {
        Alert.alert('Challenge Created', `${GAME_BY_TYPE[createGameType].name} challenge is now open. Every player has been notified.`);
      }
      setOpponentUsername('');
      setTab('mine');
      loadAll();
    } catch (err) {
      Alert.alert('Create failed', err?.message || 'Could not create the challenge.');
    } finally {
      setCreating(false);
    }
  };

  const renderOpenItem = (ch) => {
    const mapped = GAME_BY_TYPE[ch.gameType];
    const isEnded = ['ended', 'completed', 'finished'].includes(String(ch.status).toLowerCase());
    const isAccepted = ch.status === 'accepted';
    const opts = ch.options || {};
    const settingsSummary = [
      opts.timer && `Timer: ${opts.timer}`,
      opts.playerCount && `${opts.playerCount} Players`,
      opts.tokenCount && `${opts.tokenCount} Tokens`,
      opts.cardCount && `${opts.cardCount} Cards`,
      opts.seedCount && `${opts.seedCount} Seeds`,
    ].filter(Boolean).join(' • ');

    return (
      <View key={ch.id} style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.inputBorder }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleLeft}>
            <Swords size={16} color={theme.accent} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              {mapped?.name || ch.gameType}
            </Text>
          </View>
        </View>
        <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
          {ch.isDirect ? '🎯 Challenged you · ' : ''}{ch.creatorDisplayName || 'A player'} · {ch.gameType}
        </Text>
        {!!settingsSummary && (
          <Text style={[styles.cardSub, { color: '#00E5FF', fontWeight: '700', marginTop: 2 }]}>
            ⚙️ {settingsSummary}
          </Text>
        )}
        {isEnded ? (
          <View style={styles.endedBanner}>
            <Text style={styles.endedBannerText}>🔒 CHALLENGE ENDED</Text>
          </View>
        ) : isAccepted ? (
          <View style={styles.acceptedBanner}>
            <Text style={styles.acceptedBannerText}>⚔️ CHALLENGE ACCEPTED</Text>
          </View>
        ) : (
          <GAButton
            title="Accept Challenge"
            onPress={() => acceptChallenge(ch)}
            loading={busyId === ch.id}
            disabled={busyId !== null}
            icon={<Check size={18} color="#FFF" />}
            style={styles.cardBtn}
          />
        )}
        {!isEnded && !isAccepted && ch.isDirect && (
          <TouchableOpacity onPress={() => declineChallenge(ch)} disabled={busyId !== null} style={styles.cancelLink}>
            <Text style={[styles.cancelText, { color: theme.danger || '#FF3B30' }]}>Decline</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderMineItem = (ch) => {
    const mapped = GAME_BY_TYPE[ch.gameType];
    const isAccepted = ch.status === 'accepted';
    const isOpen = ch.status === 'open';
    const isEnded = ['ended', 'completed', 'finished'].includes(String(ch.status).toLowerCase());

    const label = isEnded
      ? '🔒 Challenge Ended'
      : isAccepted
      ? `⚔️ Challenge Accepted by ${ch.acceptedDisplayName || 'a player'}`
      : isOpen
      ? (ch.isDirect
          ? `Request sent to ${ch.targetUsername ? `@${ch.targetUsername}` : (ch.targetDisplayName || 'a player')} — waiting for a reply`
          : 'Open — waiting for a challenger')
      : ch.status === 'declined'
      ? `Declined by ${ch.targetUsername ? `@${ch.targetUsername}` : (ch.targetDisplayName || 'the player')}`
      : 'Cancelled';

    const labelColor = isEnded ? theme.textMuted : isAccepted ? theme.success : isOpen ? theme.accent : theme.textMuted;

    const opts = ch.options || {};
    const settingsSummary = [
      opts.timer && `Timer: ${opts.timer}`,
      opts.playerCount && `${opts.playerCount} Players`,
      opts.tokenCount && `${opts.tokenCount} Tokens`,
      opts.cardCount && `${opts.cardCount} Cards`,
      opts.seedCount && `${opts.seedCount} Seeds`,
    ].filter(Boolean).join(' • ');

    return (
      <View key={ch.id} style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.inputBorder }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleLeft}>
            <Swords size={16} color={theme.accent} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              {mapped?.name || ch.gameType}
            </Text>
          </View>
        </View>
        <Text style={[styles.cardSub, { color: labelColor, fontWeight: '700' }]}>{label}</Text>
        {!!settingsSummary && (
          <Text style={[styles.cardSub, { color: '#00E5FF', fontWeight: '700', marginTop: 2 }]}>
            ⚙️ {settingsSummary}
          </Text>
        )}
        <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
          Created {new Date(ch.createdAt).toLocaleDateString()}
        </Text>
        {isAccepted && ch.roomId && !isEnded && (
          <GAButton
            title="Join Match"
            onPress={() =>
              joinRoom({
                gameType: ch.gameType,
                roomId: ch.roomId,
                entryFee: 0,
                prizePool: 0,
                opponent: { displayName: ch.acceptedDisplayName || 'Your opponent' },
                options: ch.options,
              })
            }
            icon={<Trophy size={18} color="#FFF" />}
            style={styles.cardBtn}
          />
        )}
        {isOpen && (
          <TouchableOpacity onPress={() => cancelChallenge(ch)} disabled={busyId === ch.id} style={styles.cancelLink}>
            {busyId === ch.id ? (
              <ActivityIndicator size="small" color={theme.danger || '#FF3B30'} />
            ) : (
              <Text style={[styles.cancelText, { color: theme.danger || '#FF3B30' }]}>Cancel Challenge</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderCreate = () => {
    return (
      <View>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Game</Text>
        {lockedGameType ? (
          <Text style={[styles.gameChipText, { color: theme.accent, marginBottom: 16 }]}>
            {GAME_BY_TYPE[lockedGameType].name}
          </Text>
        ) : (
        <View style={styles.tierGrid}>
          {Object.keys(GAME_BY_TYPE).map((gt) => {
            const selected = createGameType === gt;
            return (
              <TouchableOpacity
                key={gt}
                onPress={() => setCreateGameType(gt)}
                style={[
                  styles.gameChip,
                  {
                    backgroundColor: selected ? theme.cardBg : theme.inputBg,
                    borderColor: selected ? theme.primary : theme.inputBorder,
                  },
                ]}
              >
                <Text style={[styles.gameChipText, { color: selected ? theme.accent : theme.textMuted }]}>
                  {GAME_BY_TYPE[gt].name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        )}

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Challenge a specific player (optional)</Text>
        <View style={[styles.amountRow, { borderColor: theme.inputBorder }]}>
          <Text style={[styles.amountPrefix, { color: theme.textSecondary }]}>@</Text>
          <TextInput
            value={opponentUsername}
            onChangeText={setOpponentUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="their username"
            placeholderTextColor={theme.textSecondary}
            style={[styles.amountInput, { color: theme.textPrimary }]}
          />
        </View>
        <Text style={[styles.amountHint, { color: theme.textSecondary }]}>
          Leave empty to post an open challenge that every player can see.
        </Text>

        <View style={[styles.amountCard, { backgroundColor: theme.cardBg, borderColor: theme.inputBorder }]}>
          <Text style={[styles.freeNote, { color: theme.textSecondary }]}>
            Challenges are free to create and play — no entry fee, no stake, no prize pool.
          </Text>
        </View>

        <Text style={[styles.note, { color: theme.textMuted }]}>
          Open challenges have no expiry. Every player is notified; your match
          starts once an acceptor joins and you rejoin the room.
        </Text>

        <GAButton
          title={opponentUsername.trim() ? 'Send Challenge Request' : 'Create Challenge'}
          onPress={create}
          loading={creating}
          icon={<Swords size={20} color="#FFF" />}
          style={{ marginTop: 20 }}
        />
      </View>
    );
  };

  const renderEmpty = (msg) => (
    <View style={styles.emptyBox}>
      <Text style={[styles.emptyText, { color: theme.textMuted }]}>{msg}</Text>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ArrowLeft size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <BrandLogo size={36} variant="icon" />
        <Text style={[styles.title, { color: theme.textPrimary }]}>Challenges</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn} disabled={refreshing}>
          {refreshing ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <RefreshCw size={20} color={theme.accent} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {[
          { key: 'open', label: 'Open' },
          { key: 'mine', label: 'My Challenges' },
          { key: 'create', label: 'Create' },
        ].map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tab, active && { backgroundColor: theme.primary }]}
            >
              <Text style={[styles.tabText, { color: active ? '#fff' : theme.textSecondary }]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!!loadError && (
        <TouchableOpacity onPress={() => loadAll(true)} style={[styles.errorBanner, { backgroundColor: theme.danger || '#FF3B30' }]}>
          <Text style={styles.errorBannerText}>⚠️ {loadError} — tap to retry</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {tab === 'open' &&
            (openList.length === 0
              ? renderEmpty('No open challenges right now. Create one and every player will be notified.')
              : openList.map(renderOpenItem))}

          {tab === 'mine' &&
            (mineList.length === 0
              ? renderEmpty('You have not created or accepted any challenges yet.')
              : mineList.map(renderMineItem))}

          {tab === 'create' && renderCreate()}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  backBtn: {
    padding: 4,
  },
  refreshBtn: {
    marginLeft: 'auto',
    padding: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  tabText: {
    fontWeight: '700',
    fontSize: 13,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  cardSub: {
    fontSize: 13,
  },
  cardBtn: {
    marginTop: 8,
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  cancelText: {
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 10,
  },
  tierGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  gameChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  gameChipText: {
    fontWeight: '800',
    fontSize: 13,
  },
  freeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  freeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  freeChipText: {
    fontWeight: '700',
    fontSize: 13,
  },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  freeNote: {
    fontSize: 13,
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  amountPrefix: {
    fontSize: 20,
    fontWeight: '900',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    paddingVertical: 12,
  },
  amountHint: {
    fontSize: 12,
    marginBottom: 10,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  quickChipText: {
    fontWeight: '800',
    fontSize: 13,
  },
  stakeCard: {
    width: '30%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    gap: 4,
  },
  tierName: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tierAmount: {
    fontSize: 16,
    fontWeight: '900',
  },
  tierFee: {
    fontSize: 11,
  },
  summaryCard: {
    gap: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  note: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  errorBanner: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBox: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  endedBanner: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
  },
  endedBannerText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  acceptedBanner: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    alignItems: 'center',
  },
  acceptedBannerText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});