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
} from 'react-native';
import { ArrowLeft, Swords, Wallet, Check, X, Trophy, RefreshCw } from 'lucide-react-native';
import BrandLogo from '../../components/BrandLogo';
import GAButton from '../../components/GAButton';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { challenges } from '../../services/api';
import { GamearnSocket } from '../../services/gamearnSocket';
import { ENTRY_FEES, koboToN, naira } from '../../config/appConfig';

const CREATE_TIERS = [
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'expert', label: 'Expert' },
  { key: 'free', label: 'Free', feeKobo: 0 },
];

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

  const routeGameType = GAME_BY_TYPE[route.params?.gameType] ? route.params.gameType : 'whot';

  const [tab, setTab] = useState('open'); // open | mine | create
  const [openList, setOpenList] = useState([]);
  const [mineList, setMineList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [createGameType, setCreateGameType] = useState(routeGameType);
  const [selectedTier, setSelectedTier] = useState('beginner');
  const [creating, setCreating] = useState(false);

  const sockRef = useRef(null);

  const createTiers = ENTRY_FEES[createGameType] || ENTRY_FEES.whot;
  const selectedFee = selectedTier === 'free' ? 0 : createTiers[selectedTier] || createTiers.beginner;
  const balanceNaira = Number(userProfile?.walletBalance ?? userProfile?.coins ?? 0);
  const balanceKobo = Math.round(balanceNaira * 100);

  const loadAll = useCallback(async () => {
    try {
      const [openRes, mineRes] = await Promise.allSettled([challenges.list(), challenges.my()]);
      if (openRes.status === 'fulfilled') setOpenList(openRes.value?.data ?? openRes.value ?? []);
      if (mineRes.status === 'fulfilled') setMineList(mineRes.value?.data ?? mineRes.value ?? []);
    } catch (err) {
      // silent — UI still renders with whatever loaded
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadAll().finally(() => setLoading(false));

    const sock = new GamearnSocket({
      onConnected: () => {},
      onChallengeCreated: () => loadAll(),
      onChallengeAccepted: () => {
        loadAll();
      },
      onMatchFound: (p) => {
        // Another player accepted MY open challenge -> jump straight into the
        // waiting room (the creator's side; fees debit at start once we join).
        const mapped = GAME_BY_TYPE[p.gameType];
        if (!mapped) return;
        sockRef.current?.disconnect();
        sockRef.current = null;
        navigation.navigate(mapped.targetScreen, {
          mode: 'multiplayer',
          gameId: mapped.gameId,
          roomId: p.roomId,
          entryFee: p.entryFee,
          prizePool: p.prizePool,
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
    navigation.navigate(mapped.targetScreen, {
      mode: 'multiplayer',
      gameId: mapped.gameId,
      roomId: p.roomId,
      entryFee: p.entryFee,
      prizePool: p.prizePool,
      opponent: p.opponent,
      timer: '2m',
      aiDifficulty: 'auto',
      tokenCount: 4,
      playerColor: 'white',
      cardCount: 6,
      enableSpecialCards: true,
    });
  };

  const acceptChallenge = async (ch) => {
    const fee = ch.entryFeeKobo ?? ch.entryFee * 100;
    if (balanceKobo < fee) {
      Alert.alert(
        'Insufficient balance',
        `This challenge costs ${naira(koboToN(fee))}. Your balance is ${naira(balanceNaira)}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Coins', onPress: () => navigation.navigate('BuyCoins') },
        ],
      );
      return;
    }
    setBusyId(ch.id);
    try {
      const res = await challenges.accept(ch.id);
      const payload = res?.data ?? res;
      const room = payload?.room ?? payload;
      const matchPayload = payload?.payload ?? payload;
      // Acceptor navigates straight into the room; the creator is notified via
      // socket (online) or FCM push (offline) and rejoins from "My matches".
      joinRoom({
        gameType: matchPayload?.gameType ?? ch.gameType,
        roomId: matchPayload?.roomId ?? room?.roomId,
        entryFee: matchPayload?.entryFee ?? room?.entryFee,
        prizePool: matchPayload?.prizePool ?? room?.prizePool,
        opponent: matchPayload?.opponent ?? null,
      });
    } catch (err) {
      Alert.alert('Accept failed', err?.message || 'Could not accept the challenge.');
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
    if (selectedFee > 0 && balanceKobo < selectedFee) {
      Alert.alert(
        'Insufficient balance',
        `This challenge costs ${naira(koboToN(selectedFee))}. Your balance is ${naira(balanceNaira)}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Coins', onPress: () => navigation.navigate('BuyCoins') },
        ],
      );
      return;
    }
    setCreating(true);
    try {
      const res = await challenges.create({
        gameType: createGameType,
        entryFeeKobo: selectedFee,
        options: {
          timer: '2m',
          aiDifficulty: 'auto',
          tokenCount: 4,
          playerColor: 'white',
          cardCount: 6,
          enableSpecialCards: true,
        },
      });
      Alert.alert('Challenge Created', `${selectedFee === 0 ? 'Free' : `N${naira(koboToN(selectedFee))}`} ${GAME_BY_TYPE[createGameType].name} challenge is now open. Every player has been notified.`);
      setTab('mine');
      await loadAll();
    } catch (err) {
      Alert.alert('Create failed', err?.message || 'Could not create the challenge.');
    } finally {
      setCreating(false);
    }
  };

  const renderOpenItem = (ch) => {
    const fee = ch.entryFeeKobo ?? ch.entryFee * 100;
    const mapped = GAME_BY_TYPE[ch.gameType];
    return (
      <View key={ch.id} style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.inputBorder }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleLeft}>
            <Swords size={16} color={theme.accent} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              {mapped?.name || ch.gameType}
            </Text>
          </View>
          <Text style={[styles.cardAmount, { color: theme.primary }]}>{naira(koboToN(fee))}</Text>
        </View>
        <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
          {ch.creatorDisplayName || 'A player'} · {ch.gameType} · {fee.toLocaleString()} coins
        </Text>
        <GAButton
          title="Accept Challenge"
          onPress={() => acceptChallenge(ch)}
          loading={busyId === ch.id}
          disabled={busyId !== null}
          icon={<Check size={18} color="#FFF" />}
          style={styles.cardBtn}
        />
      </View>
    );
  };

  const renderMineItem = (ch) => {
    const fee = ch.entryFeeKobo ?? ch.entryFee * 100;
    const mapped = GAME_BY_TYPE[ch.gameType];
    const isAccepted = ch.status === 'accepted';
    const isOpen = ch.status === 'open';
    const label = isAccepted
      ? `Accepted by ${ch.acceptedDisplayName || 'a player'}`.trim()
      : isOpen
      ? 'Open — waiting for a challenger'
      : 'Cancelled';
    const labelColor = isAccepted ? theme.success : isOpen ? theme.accent : theme.textMuted;
    return (
      <View key={ch.id} style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.inputBorder }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleLeft}>
            <Swords size={16} color={theme.accent} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              {mapped?.name || ch.gameType}
            </Text>
          </View>
          <Text style={[styles.cardAmount, { color: theme.primary }]}>{naira(koboToN(fee))}</Text>
        </View>
        <Text style={[styles.cardSub, { color: labelColor }]}>{label}</Text>
        <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
          Created {new Date(ch.createdAt).toLocaleDateString()}
        </Text>
        {isAccepted && ch.roomId && (
          <GAButton
            title="Join Match"
            onPress={() =>
              joinRoom({
                gameType: ch.gameType,
                roomId: ch.roomId,
                entryFee: fee,
                prizePool: Math.floor(fee * 1.9),
                opponent: { displayName: ch.acceptedDisplayName || 'Your opponent' },
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

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Entry Tier</Text>
        <View style={styles.tierGrid}>
          {CREATE_TIERS.map((tier) => {
            const fee = tier.feeKobo != null ? tier.feeKobo : ENTRY_FEES[createGameType]?.[tier.key] || createTiers[tier.key];
            const selected = selectedTier === tier.key;
            return (
              <TouchableOpacity
                key={tier.key}
                onPress={() => setSelectedTier(tier.key)}
                style={[
                  styles.stakeCard,
                  {
                    backgroundColor: selected ? theme.cardBg : theme.inputBg,
                    borderColor: selected ? theme.primary : theme.inputBorder,
                  },
                ]}
              >
                <Text style={[styles.tierName, { color: selected ? theme.accent : theme.textMuted }]}>
                  {tier.label}
                </Text>
                <Text style={[styles.tierAmount, { color: theme.textPrimary }]}>
                  {fee === 0 ? 'FREE' : naira(koboToN(fee))}
                </Text>
                <Text style={[styles.tierFee, { color: theme.textSecondary }]}>
                  {fee === 0 ? 'No prize' : `${fee.toLocaleString()} coins`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={{ color: theme.textSecondary }}>Wallet balance:</Text>
            <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{naira(balanceNaira)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ color: theme.textSecondary }}>Entry fee (deducted at match start):</Text>
            <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>
              {selectedFee === 0 ? 'FREE' : naira(koboToN(selectedFee))}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ color: theme.textSecondary }}>Winner takes (up to):</Text>
            <Text style={{ color: theme.success, fontWeight: '800' }}>
              {selectedFee === 0 ? 'No prize' : naira(koboToN(Math.floor(selectedFee * 1.9)))}
            </Text>
          </View>
          <Text style={[styles.note, { color: theme.textMuted }]}>
            Open challenges have no expiry. Every player is notified; your match
            starts once an acceptor joins and you rejoin the room. Free challenges
            have no prize pool.
          </Text>
        </View>

        <GAButton
          title="Create Challenge"
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
});