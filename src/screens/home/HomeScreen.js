import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reference, regions } from './art';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { wallet, tournaments } from '../../services/api';
const { INITIAL_STATE, reducer, parseAmount, money, localDay, leaderboard } = require('./model');

const STORAGE_KEY = '@adebayo-dashboard/v1';
const CYAN = '#00d9ff';
const GREEN = '#12ff39';
const GAMES = [
  { id: 'ludo', name: 'Ludo', description: 'Race your four tokens around the board and bring them home.', targetScreen: 'LudoGame' },
  { id: 'ayo', name: 'Ayo Ọ̀pọ́n', description: 'Sow seeds around the wooden board and capture your opponent’s seeds.', targetScreen: 'AyoGame' },
  { id: 'whot', name: 'Whot', description: 'Match shapes or numbers and be the first to empty your hand.', targetScreen: 'WhotGame' },
  { id: 'draft', name: 'Draft', description: 'Move diagonally, capture pieces, and crown your kings.', targetScreen: 'DraughtsGame' },
];

function Art({ name, width, height, style }) {
  const [x, y, w, h] = regions[name];
  const factor = Math.max(width / w, height / h);
  return (
    <View accessible={false} pointerEvents="none" style={[{ width, height, overflow: 'hidden' }, style]}>
      <Image
        source={reference}
        accessibilityIgnoresInvertColors
        resizeMode="stretch"
        style={{
          position: 'absolute',
          width: 590 * factor,
          height: 1280 * factor,
          left: -x * factor + (width - w * factor) / 2,
          top: -y * factor + (height - h * factor) / 2,
        }}
      />
    </View>
  );
}

function Tap({ onPress, label, children, style, disabled, selected, role = 'button' }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}
      hitSlop={4}
      style={({ pressed }) => [style, pressed && { opacity: 0.75 }, disabled && { opacity: 0.45 }]}
    >
      {children}
    </Pressable>
  );
}

function GradientButton({ title, onPress, style, compact = false, disabled = false, scale = 1 }) {
  return (
    <Tap onPress={onPress} label={title} disabled={disabled} style={style}>
      <LinearGradient
        colors={['#ff9900', '#ff450d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[ui.button, compact && { minHeight: 40 * scale, paddingVertical: 8 * scale, paddingHorizontal: 20 * scale, borderRadius: 24 * scale, gap: 8 * scale }]}
      >
        <Text style={[ui.buttonText, compact && { fontSize: 16 * scale }]}>{title}</Text>
        <Ionicons name="chevron-forward" size={19 * scale} color="#fff" />
      </LinearGradient>
    </Tap>
  );
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scale = Math.min(width, 650) / 590;
  const { theme, isDark } = useTheme();
  const { userProfile } = useAuth();
  const s = useMemo(() => makeStyles(scale, theme, isDark), [scale, theme, isDark]);

  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('Home');
  const [period, setPeriod] = useState('Daily');
  const [sheet, setSheet] = useState(null);
  const [amount, setAmount] = useState('');
  const [formError, setFormError] = useState('');
  const [name, setName] = useState('');
  const [roll, setRoll] = useState(null);
  const [demoComplete, setDemoComplete] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [backendWallet, setBackendWallet] = useState(null);
  const [featuredTournament, setFeaturedTournament] = useState(null);
  const [homeDataLoading, setHomeDataLoading] = useState(true);
  const pendingWrites = useRef(Promise.resolve());
  const mounted = useRef(true);
  const depositLock = useRef(false);
  const scroll = useRef(null);

  useEffect(() => {
    mounted.current = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw && mounted.current) dispatch({ type: 'HYDRATE', value: JSON.parse(raw) });
      })
      .catch(() => {
        if (mounted.current) setStorageError('Saved data could not be loaded. No saved preferences were found.');
      })
      .finally(() => {
        if (mounted.current) setReady(true);
      });
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.allSettled([wallet.get(), tournaments.list()]).then(([walletResult, tournamentResult]) => {
      if (!active) return;
      if (walletResult.status === 'fulfilled') setBackendWallet(walletResult.value);
      if (tournamentResult.status === 'fulfilled') {
        const list = Array.isArray(tournamentResult.value)
          ? tournamentResult.value
          : tournamentResult.value?.tournaments || tournamentResult.value?.data || [];
        setFeaturedTournament(list.find((item) => ['open', 'live', 'registration_open'].includes(String(item.status).toLowerCase())) || null);
      }
      setHomeDataLoading(false);
    });
    return () => { active = false; };
  }, []);

  // The backend returns `balance` in naira. Keep accounting kobo out of the UI.
  const walletBalanceNaira = Number(backendWallet?.balance ?? userProfile?.walletBalance ?? 0);
  const formatNaira = (value) => `\u20A6${Number(value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const streakDays = Number(userProfile?.streak ?? userProfile?.currentStreak ?? 0);

  const displayName = userProfile?.username || userProfile?.fullName || userProfile?.name || state.name || 'Gamer';

  useEffect(() => {
    const currentName = userProfile?.username || userProfile?.fullName || userProfile?.name;
    if (currentName && currentName !== state.name) {
      dispatch({ type: 'NAME', value: currentName });
    }
  }, [userProfile]);

  useEffect(() => {
    if (!ready) return;
    pendingWrites.current = pendingWrites.current
      .then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)))
      .catch(() => {
        if (mounted.current) setStorageError('Changes are active, but could not be saved on this device.');
      });
  }, [state, ready]);

  const launchGame = (game) => {
    if (!navigation) return;
    navigation.navigate('GameSection', {
      gameId: game.id,
      gameName: game.name,
      targetScreen: game.targetScreen,
    });
  };

  const open = (type, data) => {
    setFormError('');
    setAmount('');
    setRoll(null);
    setDemoComplete(false);
    depositLock.current = false;
    if (type === 'profile') setName(state.name);
    if (type === 'notifications') dispatch({ type: 'READ_NOTIFICATIONS' });
    setSheet({ type, data });
  };

  const changeTab = (next) => {
    setTab(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  const txt = (value, size = 18, style) => <Text style={[s.text, { fontSize: size * scale }, style]}>{value}</Text>;
  const icon = (iconName, size = 24, color = CYAN) => <Ionicons name={iconName} size={size * scale} color={color} />;
  const rows = [];

  const addFunds = () => {
    const parsed = parseAmount(amount);
    if (parsed === null) {
      setFormError('Enter â‚¦100â€“â‚¦1,000,000, using no more than two decimal places.');
      return;
    }
    setSheet(null);
    navigation?.navigate('BuyCoins');
  };

  function Header() {
    const displayName = userProfile?.username || userProfile?.fullName || state.name;
    const avatarUri = userProfile?.avatar;
    const initials = displayName.trim().slice(0, 1).toUpperCase() || '?';

    return (
      <View style={s.header}>
        <Tap label="Open your profile" onPress={() => navigation?.navigate('ProfileTab')} style={s.member}>
          <LinearGradient colors={[CYAN, '#146aff', '#ffbb00']} style={s.avatarRing}>
            {avatarUri && avatarUri.startsWith('http') ? (
              <Image source={{ uri: avatarUri }} style={[s.avatar, { width: 55 * scale, height: 55 * scale, borderRadius: (55 * scale) / 2 }]} />
            ) : (
              <View style={[s.avatar, s.avatarFallback]}><Text style={s.avatarInitial}>{initials}</Text></View>
            )}
          </LinearGradient>
          <View style={{ marginLeft: 15 * scale }}>
            {txt(displayName, 20, s.medium)}
            <View style={s.inline}>
              <View style={s.dot} />
              {txt('Active Member', 15, s.cyan)}
            </View>
          </View>
        </Tap>
        <Tap label={state.notificationsRead ? 'Notifications' : 'Notifications, unread messages'} onPress={() => open('notifications')} style={s.roundIcon}>
          {icon('notifications-outline', 31)}
          {!state.notificationsRead && <View style={s.unread} />}
        </Tap>
        <Tap label="Settings" onPress={() => navigation?.navigate('Settings')} style={s.roundIcon}>
          {icon('settings-outline', 31)}
        </Tap>
      </View>
    );
  }

  function WalletCard() {
    return (
      <LinearGradient colors={['#003a72', '#001324', '#00101e']} style={[s.card, s.wallet]}>
        <View style={s.walletIcon}>{icon('wallet-outline', 34)}</View>
        <Tap label={`Open wallet, balance ${formatNaira(walletBalanceNaira)}`} onPress={() => changeTab('Wallet')} style={{ flex: 1 }}>
          {txt('Wallet Balance', 13, s.muted)}
          {txt(homeDataLoading ? 'Loadingâ€¦' : formatNaira(walletBalanceNaira), 24, s.bold)}
          {txt('Live balance from wallet', 13, s.cyan)}
        </Tap>
        <Tap label="Add funds" onPress={() => open('deposit')} style={s.plus}>
          {icon('add', 27, '#002741')}
        </Tap>
      </LinearGradient>
    );
  }

  function TournamentCard() {
    if (homeDataLoading) return <Text style={[s.muted, { marginVertical: 18 * scale }]}>Loading live tournamentsâ€¦</Text>;
    if (!featuredTournament) return <Text style={[s.muted, { marginVertical: 18 * scale }]}>No live tournaments right now.</Text>;
    const tournament = featuredTournament;
    return (
      <LinearGradient colors={['#172019', '#170b19', '#001b30']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.tournament}>
        <Art name="tournament" width={320 * scale} height={168 * scale} style={s.trophyArt} />
        <LinearGradient colors={['#001321', '#001321b0', '#00132100']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
        <View style={s.badges}>
          <View style={s.live}>{txt('Live Now', 13, { color: '#00110a', fontWeight: '800' })}</View>
          <View style={s.playersBadge}>
            {icon('people', 14, '#fff')}
            {txt(`${Number(tournament.currentPlayers ?? tournament.playersCount ?? 0).toLocaleString()} Players`, 12)}
          </View>
        </View>
        {txt(tournament.name || 'Live Tournament', 23, s.tournamentTitle)}
        {txt(tournament.description || 'Join an active tournament.', 15, s.muted)}
        <View style={s.prizeRow}>
          <View>
            {txt('Prize Pool', 13, s.muted)}
            {txt(tournament.prizePool ? `â‚¦${Number(tournament.prizePool).toLocaleString()}` : 'Prize pool unavailable', 25, [s.bold, s.cyan])}
          </View>
          <GradientButton title={state.joined ? 'Joined âœ“' : 'Join Now'} onPress={() => navigation.navigate('LiveTournament')} style={{ width: 148 * scale }} compact scale={scale} />
        </View>
      </LinearGradient>
    );
  }

  function GameCard({ game }) {
    return (
      <Tap label={`${game.name}. Open game lobby`} onPress={() => launchGame(game)} style={s.gameCard}>
        <Art name={game.id} width={116 * scale} height={81 * scale} style={{ width: '100%' }} />
        <View style={s.gameText}>
          {txt(game.name, 15, s.bold)}
          <View style={s.inline}>
            <View style={s.dot} />
          {txt('Live count unavailable', 11, s.muted)}
          </View>
        </View>
      </Tap>
    );
  }

  function Streak() {
    return (
      <LinearGradient colors={['#002332', '#07122b', '#200732']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.streak}>
        <View style={s.sectionRow}>
          {txt('Streak Progress', 18, s.bold)}
          {txt('Day 90: +500 coins and Elite Champion', 10, s.muted)}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled style={s.milestoneScroller} contentContainerStyle={s.milestones}>
          <View style={s.milestoneTrack}>
            <View style={s.track} />
            <View style={[s.track, { width: `${Math.min(streakDays / 90, 1) * 32}%`, backgroundColor: CYAN }]} />
            {[7, 14, 30, 50, 90].map((day) => {
              const done = streakDays >= day;
              return (
                <Tap key={day} label={`${day} day milestone, ${done ? 'completed' : 'locked'}`} onPress={() => open('streak')} style={s.milestone}>
                  <View style={[s.milestoneCircle, done && s.done]}>
                    {icon(done ? 'checkmark' : 'lock-closed', 19, done ? '#fff' : '#d8e4ef')}
                  </View>
                  {txt(String(day), 13, { marginTop: 6 * scale, color: '#fff' })}
                  {txt('Days', 12, { color: '#ced6e8' })}
                </Tap>
              );
            })}
            <Tap label="90 day reward details" onPress={() => open('reward')} style={s.reward}>
              <Art name="gift" width={48 * scale} height={55 * scale} style={s.gift} />
              {txt(`90-Day\nReward\n${streakDays >= 90 ? 'Unlocked' : 'Locked'}`, 12, { textAlign: 'center', lineHeight: 14 * scale })}
            </Tap>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  function Leaderboard() {
    return (
      <View style={{ marginTop: 15 * scale }}>
        <View style={s.sectionRow}>
          {txt('Global Leaderboard', 20, s.bold)}
          <View style={s.filters}>
            {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((p) => (
              <Tap key={p} label={`${p} leaderboard`} role="tab" selected={period === p} onPress={() => setPeriod(p)} style={[s.filter, period === p && s.activeFilter]}>
                {txt(p, 10, { color: period === p ? '#002239' : '#d7d7ee' })}
              </Tap>
            ))}
          </View>
        </View>
        {rows.length === 0 ? (
          <Text style={[s.muted, { marginTop: 12 * scale }]}>Leaderboard data unavailable.</Text>
        ) : rows.map((player, index) => (
          <Tap key={player.id} label={`${index + 1}, ${player.name}, ${player.wins} wins, ${player.xp} XP`} onPress={() => open('player', player)} style={[s.leaderRow, index === 0 && s.firstRow]}>
            <View style={[s.rank, index < 3 && { borderColor: ['#eab51b', '#91a6b9', '#ff8a00'][index], backgroundColor: ['#8f6400', '#526b80', '#bf4004'][index] }]}>
              {index < 3 && <View style={s.medalRibbon} />}
              {txt(String(index + 1), 17, index === 0 && { color: '#fff676' })}
            </View>
            <Art name={player.avatar} width={32 * scale} height={32 * scale} style={s.smallAvatar} />
            <View style={{ flex: 1 }}>
              {txt(player.name, 12)}
              {txt(`${player.wins} Wins`, 11, s.muted)}
            </View>
            {txt(`${player.xp.toLocaleString('en-US')} XP`, 14, [s.bold, index === 0 && { color: '#ffe856' }])}
          </Tap>
        ))}
      </View>
    );
  }

  function Home() {
    return (
      <>
        <View style={s.welcomeRow}>
          <View style={{ flex: 1 }}>
            {txt('Welcome,', 24, s.bold)}
            <View style={s.inline}>
              {txt(displayName, 37, [s.bold, s.cyan, { maxWidth: 205 * scale }])}
              {txt(' \uD83D\uDC4B', 31)}
            </View>
            {txt('Play. Earn. Belong.', 16, s.muted)}
          </View>
          <Tap label="More games, bigger rewards" onPress={() => open('rewards')} style={s.promoWrap}>
            <LinearGradient colors={['#652d05', '#06152c', '#450098']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.promo}>
              <Art name="crown" width={57 * scale} height={56 * scale} />
              {txt('More Games\nBigger Rewards', 16, [s.bold, { flex: 1, marginLeft: 10 * scale }])}
              {icon('chevron-forward', 25, '#c7b8ff')}
            </LinearGradient>
          </Tap>
        </View>
        <View style={s.stats}>
          <WalletCard />
          <Tap label={`${streakDays} day streak. View details`} onPress={() => open('streak')} style={[s.card, s.streakSummary]}>
            <Art name="flame" width={47 * scale} height={62 * scale} />
            <View style={{ flex: 1, marginLeft: 6 * scale }}>
              <View style={s.inline}>
                {txt(`${streakDays} Days`, 21, s.bold)}
                <View style={s.activeBadge}>
                  {txt('Active', 12, { color: '#001a0b', fontWeight: '700' })}
                  {icon('checkmark-circle', 13, '#00511b')}
                </View>
              </View>
              {txt('Day Streak', 14, s.muted)}
              {txt('Great! Keep it going.', 13, s.cyan)}
            </View>
            {icon('chevron-forward', 18, '#e6e9ff')}
          </Tap>
        </View>
        <Streak />
        <View style={s.playStrip}>
          {icon('information-circle', 29)}
          <View style={{ flex: 1, marginLeft: 9 * scale }}>
            {txt('Play a game today to keep your streak!', 13, s.medium)}
            {txt('Streak only counts if you visit and play a game successfully.', 11, [s.muted, { marginTop: 4 * scale }])}
          </View>
          <GradientButton title="Play Now" onPress={() => open('games')} style={{ width: 155 * scale }} compact scale={scale} />
        </View>
        <TournamentCard />
        <View style={[s.sectionRow, { marginTop: 12 * scale, marginBottom: 6 * scale }]}>
          {txt('Games', 20, s.bold)}
          <Tap label="See all games" onPress={() => open('games')} style={s.inline}>
            {txt('See All', 14, s.cyan)}
            {icon('chevron-forward', 17)}
          </Tap>
        </View>
        <View style={s.gameGrid}>
          {GAMES.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </View>
        <Leaderboard />
      </>
    );
  }

  function OtherTab() {
    if (tab === 'Tournaments')
      return (
        <>
          <Text style={ui.pageTitle}>Tournaments</Text>
          <TournamentCard />
          <View style={ui.panel}>
            <Text style={ui.heading}>Your registration</Text>
            <Text style={ui.body}>{state.joined ? 'You have joined the Ayo á»Œpá»Ìn Grandmaster Tournament .' : 'Join the featured tournament to see your registration here.'}</Text>
            <GradientButton title={state.joined ? 'View tournament' : 'View entry details'} onPress={() => open('tournament')} />
          </View>
        </>
      );
    if (tab === 'Wallet')
      return (
        <>
          <Text style={ui.pageTitle}>Wallet</Text>
          <View style={ui.panel}>
            <Text style={ui.body}>Wallet balance</Text>
            <Text style={ui.balance}>{money(state.balance)}</Text>
            <GradientButton title="Add funds" onPress={() => open('deposit')} />
          </View>
          <Text style={ui.heading}>Transaction history</Text>
          {state.transactions.length === 0 ? (
            <Text style={ui.body}>No transactions yet.</Text>
          ) : (
            state.transactions.map((t) => (
              <View key={t.id} style={ui.transaction}>
                <View style={{ flex: 1 }}>
                  <Text style={ui.label}>{t.label}</Text>
                  <Text style={ui.caption}>{new Date(t.date).toLocaleString()}</Text>
                </View>
                <Text style={ui.credit}>+{money(t.amount)}</Text>
              </View>
            ))
          )}
        </>
      );
    return (
      <>
        <Text style={ui.pageTitle}>Profile</Text>
        <View style={[ui.panel, { alignItems: 'center' }]}>
          <Art name="adebayo" width={80} height={80} style={{ borderRadius: 40 }} />
          <Text style={ui.pageTitle}>{state.name}</Text>
          <Text style={ui.credit}>â— Active Member</Text>
          <Text style={ui.body}>
            {state.streak} day streak Â· 24 wins Â· 12,450 XP
          </Text>
        </View>
        <GradientButton title="Edit profile" onPress={() => open('profile')} />
        <Tap label="Open settings" onPress={() => open('settings')} style={ui.listItem}>
          <Text style={ui.label}>Settings</Text>
          <Ionicons name="settings-outline" color={CYAN} size={24} />
        </Tap>
      </>
    );
  }

  function SheetContent() {
    switch (sheet?.type) {
      case 'notifications':
        return (
          <>
            <Text style={ui.heading}>Notifications</Text>
            <View style={ui.notice}>
              <Text style={ui.label}>{'\uD83C\uDFC6 Tournament is live'}</Text>
              <Text style={ui.body}>Ayo á»Œpá»Ìn Grandmaster Tournament is open for registration.</Text>
            </View>
            <View style={ui.notice}>
              <Text style={ui.label}>{'\uD83D\uDD25 Keep your streak going'}</Text>
              <Text style={ui.body}>Youâ€™re on a {state.streak} day streak. Complete todayâ€™s daily challenge to try the streak interaction.</Text>
            </View>
            <Text style={ui.caption}>Sample notifications Â· All read</Text>
          </>
        );
      case 'settings':
        return (
          <>
            <Text style={ui.heading}>Settings</Text>
            {[
              ['sound', 'Sound effects'],
              ['notifications', 'Push notifications'],
            ].map(([key, label]) => (
              <View key={key} style={ui.listItem}>
                <Text style={ui.label}>{label}</Text>
                <Switch
                  accessibilityLabel={label}
                  value={state.settings[key]}
                  onValueChange={(value) => dispatch({ type: 'SETTING', key, value })}
                  trackColor={{ false: '#394657', true: '#008fae' }}
                  thumbColor={state.settings[key] ? CYAN : '#cad2df'}
                />
              </View>
            ))}
            <Text style={ui.body}>Preferences are saved on this device. Push delivery and game audio must be connected to your appâ€™s notification and audio services.</Text>
          </>
        );
      case 'profile':
        return (
          <>
            <Text style={ui.heading}>Edit profile</Text>
            <Text style={ui.body}>Display name</Text>
            <TextInput
              accessibilityLabel="Display name"
              value={name}
              onChangeText={setName}
              maxLength={24}
              style={ui.input}
              placeholder="Your name"
              placeholderTextColor="#788b9f"
              autoCapitalize="words"
            />
            <GradientButton
              title="Save profile"
              onPress={() => {
                if (!name.trim()) {
                  setFormError('Please enter your name.');
                  return;
                }
                dispatch({ type: 'NAME', value: name });
                if (updateProfileData) updateProfileData({ name: name.trim() });
                setSheet(null);
              }}
            />
          </>
        );
      case 'deposit':
        return (
          <>
            <Text style={ui.heading}>Add funds</Text>
            <Text style={ui.body}>Add funds through the wallet to start a payment.</Text>
            <Text style={ui.label}>Amount (NGN)</Text>
            <TextInput
              accessibilityLabel="Amount in naira"
              value={amount}
              onChangeText={(value) => {
                setAmount(value);
                setFormError('');
              }}
              keyboardType="decimal-pad"
              style={ui.input}
              placeholder="e.g. 1000.00"
              placeholderTextColor="#788b9f"
              maxLength={12}
            />
            <View style={ui.quickAmounts}>
              {['500', '1000', '5000'].map((value) => (
                <Tap key={value} label={`Set amount to ${value} naira`} onPress={() => setAmount(value)} style={ui.chip}>
                  <Text style={ui.label}>â‚¦{Number(value).toLocaleString('en-US')}</Text>
                </Tap>
              ))}
            </View>
            <GradientButton title="Add virtual funds" onPress={addFunds} />
          </>
        );
      case 'tournament':
        return (
          <>
            <Text style={ui.heading}>Ayo á»Œpá»Ìn Grandmaster Tournament</Text>
            <Art name="tournament" width={280} height={146} style={{ alignSelf: 'center', borderRadius: 12 }} />
            <Text style={ui.body}>
              Prize pool: â‚¦5,000.00{'\n'}
              Players: 1,240 (players){'\n'}
              Entry fee: Free
            </Text>
            <Text style={ui.body}>{state.joined ? 'Your registration is saved. Tap below to launch the Ayo lobby.' : 'Tournament registration is handled by the backend.'}</Text>
            <GradientButton
              title={state.joined ? 'Open Ayo lobby' : 'Confirm registration'}
              onPress={() => {
                if (state.joined) {
                  setSheet(null);
                  launchGame(GAMES[1]);
                } else dispatch({ type: 'JOIN' });
              }}
            />
          </>
        );
      case 'games':
        return (
          <>
            <Text style={ui.heading}>Choose a game</Text>
            {GAMES.map((game) => (
              <Tap key={game.id} label={`Open ${game.name}`} onPress={() => { setSheet(null); launchGame(game); }} style={ui.listItem}>
                <Art name={game.id} width={74} height={52} style={{ borderRadius: 8 }} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={ui.label}>{game.name}</Text>
                  <Text style={ui.caption}>â— {game.players} Playing</Text>
                </View>
                <Ionicons name="chevron-forward" color={CYAN} size={22} />
              </Tap>
            ))}
          </>
        );
      case 'game':
        return (
          <>
            <Text style={ui.heading}>{sheet.data.name}</Text>
            <Art name={sheet.data.id} width={174} height={122} style={{ alignSelf: 'center', borderRadius: 16 }} />
            <Text style={ui.body}>{sheet.data.description}</Text>
            <Text style={ui.label}>Daily activity</Text>
            <Text style={ui.body}>Roll a 4, 5, or 6 to complete todayâ€™s streak challenge, or launch the game lobby directly below.</Text>
            {roll !== null && <Text accessibilityLiveRegion="polite" style={ui.dice}>{['âš€', 'âš', 'âš‚', 'âšƒ', 'âš„', 'âš…'][roll - 1]}  {roll}</Text>}
            {demoComplete && <Text accessibilityLiveRegion="polite" style={ui.credit}>Challenge complete! Todayâ€™s streak activity is saved.</Text>}
            <GradientButton
              disabled={demoComplete}
              title={demoComplete ? 'Completed todayâ€™s challenge' : roll ? 'Roll again' : 'Roll the dice'}
              onPress={() => {
                const result = 1 + Math.floor(Math.random() * 6);
                setRoll(result);
                if (result >= 4) {
                  setDemoComplete(true);
                  dispatch({ type: 'COMPLETE_DEMO', day: localDay() });
                }
              }}
            />
            <View style={{ marginTop: 12 }}>
              <GradientButton title="Launch Full Game" onPress={() => { setSheet(null); launchGame(sheet.data); }} />
            </View>
          </>
        );
      case 'reward':
        return (
          <>
            <Text style={ui.heading}>Streak rewards</Text>
            <Art name="gift" width={90} height={105} style={{ alignSelf: 'center' }} />
            <Text style={ui.body}>{state.claimed ? 'Your reward status is managed by the backend.' : state.streak >= 30 ? 'Your reward is unlocked according to the backend milestone policy.' : `${30 - state.streak} more qualifying days to unlock your reward.`}</Text>
            <GradientButton disabled={state.streak < 30 || state.claimed} title={state.claimed ? 'Claimed' : state.streak >= 30 ? 'Reward status' : 'Reward locked'} onPress={() => dispatch({ type: 'CLAIM' })} />
          </>
        );
      case 'streak':
        return (
          <>
            <Text style={ui.heading}>{state.streak} Day Streak {'\uD83D\uDD25'}</Text>
            <Text style={ui.body}>Complete a qualifying game each day. Opening the app alone does not count. Complete a qualifying game to advance your streak.</Text>
            <Text style={ui.body}>Milestones: 7, 14, 30, 50, 90, 100, 120, 150, 180, 200, 250, 270, 300, 350, and 365 days. A day counts only after a completed game.</Text>
            <Text style={ui.caption}>Last activity: {state.lastPlayed || 'No completed daily challenge yet'}</Text>
            <GradientButton title="Choose a game" onPress={() => open('games')} />
          </>
        );
      case 'rewards':
        return (
          <>
            <Text style={ui.heading}>More Games. Bigger Rewards.</Text>
            <Text style={ui.body}>Explore all four games, work toward streak milestones, and join the featured tournament.</Text>
            <GradientButton title="Explore games" onPress={() => open('games')} />
            <Tap label="View 30 day reward" onPress={() => open('reward')} style={ui.listItem}>
              <Text style={ui.label}>View Streak rewards</Text>
              <Ionicons name="gift-outline" size={24} color={CYAN} />
            </Tap>
          </>
        );
      case 'player':
        return (
          <>
            <Art name={sheet.data.avatar} width={72} height={72} style={{ borderRadius: 36, alignSelf: 'center' }} />
            <Text style={ui.heading}>{sheet.data.name}</Text>
            <Text style={ui.body}>
              {period} leaderboard{'\n'}
              {sheet.data.wins} Wins{'\n'}
              {sheet.data.xp.toLocaleString('en-US')} XP
            </Text>
            <Text style={ui.caption}>Player profile</Text>
          </>
        );
      default:
        return null;
    }
  }

  if (!ready)
    return (
      <View style={ui.loading}>
        <StatusBar barStyle="light-content" backgroundColor="#00101e" />
        <ActivityIndicator color={CYAN} size="large" accessibilityLabel="Loading dashboard" />
      </View>
    );

  return (
    <View style={[ui.root, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />
      <ScrollView ref={scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always" keyboardDismissMode="none" contentContainerStyle={[s.content, { paddingTop: insets.top + 10 * scale, paddingBottom: 110 * scale }]}>
        <Header />
        {!!storageError && <Text accessibilityLiveRegion="polite" style={ui.error}>{storageError}</Text>}
        {tab === 'Home' ? <Home /> : <OtherTab />}
      </ScrollView>

      <Modal transparent visible={sheet !== null} animationType="slide" onRequestClose={() => setSheet(null)} statusBarTranslucent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={ui.modalBackdrop}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close dialog" onPress={() => setSheet(null)} style={StyleSheet.absoluteFillObject} />
          <View accessibilityViewIsModal style={[ui.sheet, { paddingBottom: Math.max(insets.bottom, 20), maxHeight: '88%' }]}>
            <View style={ui.sheetTop}>
              <View style={ui.handle} />
              <Tap label="Close dialog" onPress={() => setSheet(null)} style={ui.close}>
                <Ionicons name="close" size={26} color="#fff" />
              </Tap>
            </View>
            <ScrollView keyboardShouldPersistTaps="always" keyboardDismissMode="none" contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 16 }}>
              {SheetContent()}
              {!!formError && <Text accessibilityLiveRegion="polite" style={ui.error}>{formError}</Text>}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function makeStyles(k, theme, isDark) {
  const base = {
    content: { width: '100%', maxWidth: 650, alignSelf: 'center', paddingHorizontal: 30 },
    text: { color: theme ? theme.textPrimary : '#f7f7ff', fontSize: 18 },
    bold: { fontWeight: '700' },
    medium: { fontWeight: '500' },
    cyan: { color: theme ? theme.primary : CYAN },
    muted: { color: theme ? theme.textSecondary : '#c4c7dd' },
    inline: { flexDirection: 'row', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', height: 70, marginBottom: 8, gap: 22 },
    member: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatarRing: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', shadowColor: CYAN, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
    avatar: { borderRadius: 30 },
    avatarFallback: { backgroundColor: '#14304a', alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { color: '#fff', fontSize: 24, fontWeight: '800' },
    roundIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: isDark ? '#002138' : 'rgba(0, 0, 0, 0.06)', alignItems: 'center', justifyContent: 'center' },
    unread: { position: 'absolute', right: 13, top: 10, width: 11, height: 11, borderRadius: 6, backgroundColor: '#ff1532' },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6, backgroundColor: GREEN },
    welcomeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    promoWrap: { width: 241, borderRadius: 17, borderColor: isDark ? '#83581f' : 'rgba(0, 0, 0, 0.1)', borderWidth: 1, overflow: 'hidden' },
    promo: { flexDirection: 'row', alignItems: 'center', height: 78, paddingHorizontal: 10 },
    stats: { flexDirection: 'row', gap: 10, marginBottom: 9 },
    card: { flex: 1, height: 85, borderWidth: 1, borderColor: isDark ? '#086d96' : 'rgba(0, 0, 0, 0.08)', borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
    wallet: { paddingHorizontal: 10 },
    walletIcon: { width: 52, height: 56, backgroundColor: isDark ? '#003155' : 'rgba(0, 180, 216, 0.15)', borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    plus: { width: 35, height: 35, borderRadius: 18, backgroundColor: isDark ? '#00baf2' : '#00B4D8', alignItems: 'center', justifyContent: 'center', marginLeft: 5 },
    streakSummary: { paddingHorizontal: 8, backgroundColor: isDark ? '#001522' : '#FFFFFF' },
    activeBadge: { marginLeft: 10, borderRadius: 15, backgroundColor: GREEN, paddingHorizontal: 12, height: 26, flexDirection: 'row', alignItems: 'center', gap: 3 },
    streak: { borderRadius: 12, borderWidth: 1, borderColor: isDark ? '#087f94' : 'rgba(0, 0, 0, 0.08)', paddingHorizontal: 16, paddingTop: 7, height: 122, backgroundColor: isDark ? 'transparent' : '#FFFFFF' },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    milestoneScroller: { marginTop: 11, flex: 1 },
    milestones: { flexGrow: 1 },
    milestoneTrack: { flexDirection: 'row', alignItems: 'flex-start', minWidth: 5 * 45 + 79, position: 'relative' },
    track: { position: 'absolute', top: 16, left: 17, right: 78, height: 4, backgroundColor: isDark ? '#3c455e' : '#CBD5E1' },
    milestone: { width: 37, alignItems: 'center' },
    milestoneCircle: { width: 33, height: 33, borderRadius: 17, borderWidth: 2, borderColor: isDark ? '#64778f' : '#94A3B8', backgroundColor: isDark ? '#142035' : '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
    done: { backgroundColor: '#07872f', borderColor: '#33ff3e', shadowColor: GREEN, shadowRadius: 8, shadowOpacity: 0.9, shadowOffset: { width: 0, height: 0 } },
    gold: { backgroundColor: '#a86a00', borderColor: '#ffe537', shadowColor: '#ffb500', shadowRadius: 7, shadowOpacity: 0.85, shadowOffset: { width: 0, height: 0 } },
    reward: { width: 79, height: 68, borderRadius: 9, borderWidth: 1, borderColor: isDark ? '#946d39' : 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 3, backgroundColor: isDark ? '#07162b' : '#F1F5F9', marginTop: 5 },
    gift: { position: 'absolute', top: -34 },
    playStrip: { marginTop: 9, marginBottom: 9, height: 49, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', borderRadius: 10, backgroundColor: isDark ? '#09152f' : 'rgba(0, 180, 216, 0.12)' },
    tournament: { height: 187, borderRadius: 13, borderWidth: 1, borderColor: isDark ? '#ac7427' : 'rgba(0, 0, 0, 0.1)', overflow: 'hidden', paddingHorizontal: 21, paddingVertical: 9 },
    trophyArt: { position: 'absolute', right: 0, top: 0 },
    badges: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
    live: { backgroundColor: GREEN, paddingHorizontal: 16, paddingVertical: 5, borderRadius: 18 },
    playersBadge: { backgroundColor: isDark ? '#162131' : 'rgba(0,0,0,0.06)', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 18 },
    tournamentTitle: { fontWeight: '700', lineHeight: 24, marginBottom: 5, width: 300, color: theme ? theme.textPrimary : '#FFFFFF' },
    prizeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    gameGrid: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
    gameCard: { flex: 1, height: 130, borderRadius: 10, borderWidth: 1, borderColor: isDark ? '#095674' : 'rgba(0, 0, 0, 0.08)', overflow: 'hidden', backgroundColor: isDark ? '#021626' : '#FFFFFF' },
    gameText: { paddingHorizontal: 9, paddingTop: 4, gap: 4 },
    filters: { width: 282, height: 29, flexDirection: 'row', borderRadius: 12, backgroundColor: isDark ? '#05152c' : '#E2E8F0', borderWidth: 1, borderColor: isDark ? '#132842' : '#CBD5E1', overflow: 'hidden' },
    filter: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
    activeFilter: { backgroundColor: theme ? theme.primary : '#00bdf3' },
    leaderRow: { height: 41, marginTop: 4, borderRadius: 10, borderWidth: 1, borderColor: isDark ? '#1b2b40' : 'rgba(0,0,0,0.06)', backgroundColor: isDark ? '#031626' : '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
    firstRow: { borderColor: '#b49125', backgroundColor: isDark ? '#161a1b' : '#FEF3C7' },
    rank: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#2d3c53', alignItems: 'center', justifyContent: 'center', marginRight: 18 },
    medalRibbon: { position: 'absolute', width: 14, height: 7, top: -6, borderLeftWidth: 3, borderRightWidth: 3, borderColor: '#a0a9ae', transform: [{ rotate: '15deg' }] },
    smallAvatar: { borderRadius: 16, marginRight: 21 },
    bottomBar: { width: '100%', maxWidth: 650, alignSelf: 'center', flexDirection: 'row', borderTopWidth: 1, borderColor: '#16334a', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 14, backgroundColor: '#00111d' },
    navItem: { flex: 1, alignItems: 'center', paddingBottom: 12, minHeight: 68 },
    navGlow: { textShadowColor: '#008cff', textShadowRadius: 15, textShadowOffset: { width: 0, height: 0 } },
  };
  const unitless = new Set(['flex', 'opacity', 'shadowOpacity', 'zIndex', 'aspectRatio', 'elevation', 'flexGrow', 'flexShrink']);
  function convert(value, key) {
    if (typeof value === 'number') return unitless.has(key) ? value : value * k;
    if (Array.isArray(value)) return value.map((v) => convert(v, ''));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([name, v]) => [name, convert(v, name)]));
    return value;
  }
  return StyleSheet.create(convert(base, ''));
}

const ui = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#00101e' },
  loading: { flex: 1, backgroundColor: '#00101e', justifyContent: 'center', alignItems: 'center' },
  button: { minHeight: 46, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '700', flexShrink: 1 },
  pageTitle: { color: '#fff', fontSize: 27, fontWeight: '700', marginVertical: 18 },
  heading: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 14, marginTop: 6 },
  body: { color: '#bfcbdc', fontSize: 15, lineHeight: 23, marginVertical: 10 },
  label: { color: '#f5f7ff', fontSize: 16, fontWeight: '600' },
  caption: { color: '#9cafc6', fontSize: 12, lineHeight: 18, marginTop: 4 },
  panel: { borderWidth: 1, borderColor: '#145370', borderRadius: 16, backgroundColor: '#071d30', padding: 20, marginVertical: 16 },
  balance: { color: CYAN, fontWeight: '700', fontSize: 36, marginBottom: 18 },
  credit: { color: GREEN, fontSize: 14, lineHeight: 22, marginVertical: 8 },
  transaction: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#18324b' },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 16, borderBottomWidth: 1, borderColor: '#193047' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: '#000000b3' },
  sheet: { backgroundColor: '#071a2b', width: '100%', maxWidth: 650, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: '#1a6480' },
  sheetTop: { height: 48, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#60768b' },
  close: { position: 'absolute', right: 12, top: 3, padding: 10 },
  input: { backgroundColor: '#001321', borderWidth: 1, borderColor: '#32617d', borderRadius: 12, padding: 14, color: '#fff', fontSize: 17, marginVertical: 12 },
  quickAmounts: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  chip: { backgroundColor: '#10324a', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20 },
  error: { color: '#ffb2a8', fontSize: 14, lineHeight: 20, marginVertical: 12 },
  notice: { padding: 15, backgroundColor: '#102b40', borderRadius: 12, marginBottom: 12 },
  dice: { color: CYAN, fontSize: 64, textAlign: 'center', marginVertical: 12 },
});




