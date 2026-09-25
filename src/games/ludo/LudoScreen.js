import React, { useEffect, useReducer, useRef, useState } from 'react';
import { AppState, Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Board from './Board';
import { setActiveMatch, clearActiveMatch } from '../../utils/activeMatch';
import { useAuth } from '../../context/AuthContext';
import { recordGameStreak } from '../../utils/recordGameStreak';
import { getAiDifficulty } from '../../utils/aiDifficulty';
import { wallet } from '../../services/api';
const { COLORS, NAMES, FINISH, SAFE, globalIndex, fresh, legal, reduce } = require('./engine');
const PHOTO = require('./assets/reference.jpg');
const BONUS_KEY = '@ludo-reference/bonus-v1';
const ART = {
  logo: [482, 5, 297, 192],
  p0: [118, 65, 128, 128],
  p1: [1012, 64, 125, 125],
  p2: [35, 976, 126, 126],
  p3: [1094, 975, 123, 123],
  gift: [52, 466, 91, 88],
  left: [22, 676, 157, 244],
  right: [1086, 674, 149, 250],
};

const RULES = `This local four-player variant follows the board in the picture: five-cell arms, a 44-square perimeter, and two dice.\n\n1. Turns run red → green → yellow → blue. Pass the device to the active player.\n\n2. Roll both dice. Select either unused die, then a highlighted token. Each die makes one move. A six brings a token out of its yard; the full six is consumed.\n\n3. A token travels 43 perimeter positions, then four private lane positions and the center. You need an exact roll to finish.\n\n4. Landing on opponents on an unsafe square sends all of those tokens back to their yards. Stars and starting squares are safe. Stacked tokens do not block movement.\n\n5. A roll containing a six earns one extra turn after both dice are used or no legal moves remain. Captures and finishes do not grant extra turns. There is no three-sixes penalty.\n\n6. If no die can move a token, the turn advances automatically. Get all four tokens to the center to win.\n\n7. Each turn lasts 2:45. Time expiring forfeits unused dice and extra turns. Menus and backgrounding pause the timer.\n\n8. Undo restores the previous roll or move; this is a local practice feature. Hint recommends a finish, capture, yard exit, or advanced token.\n\nThis is not the standard 15×15, single-die ruleset. Room 458721 and 4/4 identify the local table, not an online connection.`;

function Art({ name, w, h }) {
  const [x, y, cw, ch] = ART[name];
  const f = Math.max(w / cw, h / ch);
  return (
    <View pointerEvents="none" style={{ width: w, height: h, overflow: 'hidden', borderRadius: name.startsWith('p') ? w / 2 : 0 }}>
      <Image source={PHOTO} resizeMode="stretch" style={{ position: 'absolute', width: 1254 * f, height: 1254 * f, left: -x * f + (w - cw * f) / 2, top: -y * f + (h - ch * f) / 2 }} />
    </View>
  );
}

function Button({ label, onPress, children, style, disabled = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [style, pressed && { opacity: 0.75 }, disabled && { opacity: 0.45 }]}
    >
      {children}
    </Pressable>
  );
}

function clock(seconds, hours = false) {
  const n = Math.max(0, Math.ceil(seconds));
  return hours
    ? `${String(Math.floor(n / 3600)).padStart(2, '0')}:${String(Math.floor(n / 60) % 60).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
    : `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
}

function Die({ value, size, selected, used, onPress, index }) {
  const dots = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [2, 0], [0, 2], [2, 2]],
    5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
    6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
  }[value] || [[1, 1]];

  const isRedDot = value === 1;
  const faceSize = Math.max(1, size - 4);
  const dotSize = isRedDot ? faceSize * 0.28 : faceSize * 0.18;
  const margin = faceSize * 0.13;
  const centerPos = (faceSize - dotSize) / 2;
  const endPos = faceSize - margin - dotSize;

  const getPos = (gridVal) => {
    if (gridVal === 0) return margin;
    if (gridVal === 1) return centerPos;
    return endPos;
  };

  return (
    <Button
      label={`3D Die ${index + 1}: ${value}${used ? ', unavailable' : ''}`}
      onPress={onPress}
      disabled={used}
      style={{
        width: size,
        height: size,
        position: 'relative',
        transform: [{ rotate: index ? '10deg' : '-12deg' }],
      }}
    >
      {/* 3D Drop Shadow Base */}
      <View
        style={{
          position: 'absolute',
          left: 4,
          top: 6,
          width: size - 4,
          height: size - 4,
          borderRadius: size * 0.22,
          backgroundColor: '#030712',
          opacity: 0.6,
        }}
      />

      {/* 3D Side Bevel (Depth layer) */}
      <View
        style={{
          position: 'absolute',
          left: 2,
          top: 3,
          width: size - 2,
          height: size - 2,
          borderRadius: size * 0.22,
          backgroundColor: selected ? '#d97706' : '#94a3b8',
        }}
      />

      {/* 3D Main Front Face */}
      <LinearGradient
        colors={selected ? ['#ffffff', '#fef08a', '#fde047'] : ['#ffffff', '#f8fafc', '#e2e8f0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: faceSize,
          height: faceSize,
          borderRadius: size * 0.2,
          borderWidth: selected ? 3 : 1.5,
          borderColor: selected ? '#f59e0b' : '#cbd5e1',
          position: 'relative',
          overflow: 'hidden',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 3, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
        }}
      >
        {/* Top Gloss Reflection Highlight */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 2,
            left: 4,
            right: 4,
            height: faceSize * 0.16,
            borderRadius: faceSize * 0.08,
            backgroundColor: 'rgba(255, 255, 255, 0.45)',
            zIndex: 1,
          }}
        />

        {/* 3D Inset Pip Dots */}
        {dots.map(([gx, gy], i) => {
          const posX = getPos(gx);
          const posY = getPos(gy);
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: posX,
                top: posY,
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: isRedDot ? '#dc2626' : '#0f172a',
                borderWidth: 1,
                borderColor: isRedDot ? '#991b1b' : '#334155',
                zIndex: 2,
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.5,
              }}
            >
              {/* Dot 3D Highlight */}
              <View
                style={{
                  width: dotSize * 0.28,
                  height: dotSize * 0.28,
                  borderRadius: dotSize * 0.14,
                  backgroundColor: 'rgba(255, 255, 255, 0.65)',
                  marginTop: dotSize * 0.12,
                  marginLeft: dotSize * 0.12,
                }}
              />
            </View>
          );
        })}
      </LinearGradient>
    </Button>
  );
}

function parseTimerMs(timerStr) {
  if (!timerStr) return 120000;
  if (typeof timerStr === 'number') return timerStr;
  if (timerStr.endsWith('s')) return parseInt(timerStr, 10) * 1000;
  if (timerStr.endsWith('m')) return parseInt(timerStr, 10) * 60 * 1000;
  return 120000;
}

export function LudoScreen({ onBack, stake = 250, timer = '2m', onWin, aiDifficulty = 'auto' }) {
  return (
    <SafeAreaProvider>
      <Game onBack={onBack} stake={stake} timer={timer} onWin={onWin} aiDifficulty={aiDifficulty} />
    </SafeAreaProvider>
  );
}

function Game({ onBack, stake, timer, onWin, aiDifficulty = 'auto' }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const timerMs = React.useMemo(() => parseTimerMs(timer), [timer]);
  const [state, dispatch] = useReducer(reduce, undefined, () => fresh(Date.now(), timerMs));
  const [now, setNow] = useState(Date.now());
  const [modal, setModal] = useState(null);
  const [chat, setChat] = useState([]);
  const [draft, setDraft] = useState('');
  const [hints, setHints] = useState(true);
  const [bonus, setBonus] = useState(null);
  const [storageError, setStorageError] = useState('');
  const [rollingDice, setRollingDice] = useState(false);
  const [animDice, setAnimDice] = useState([1, 1]);
  const pause = useRef(null);
  const background = useRef(false);
  const dialog = useRef(false);
  const bonusLock = useRef(false);
  const wonReported = useRef(false);

  const availableWidth = width - insets.left - insets.right;
  const sceneSize = Math.max(360, Math.min(availableWidth, height - insets.top - insets.bottom - 55, 1000));
  const k = sceneSize / 1254;
  const rect = (x, y, w, h) => ({ position: 'absolute', left: x * k, top: y * k, width: w * k, height: h * k });
  const text = (value, size = 28, style) => <Text style={[{ color: '#fff', fontSize: size * k, fontWeight: '700' }, style]}>{value}</Text>;
  const ico = (name, size = 42, color = '#fff') => <Ionicons name={name} size={size * k} color={color} />;

  const reconcilePause = () => {
    const shouldPause = background.current || dialog.current;
    if (shouldPause && pause.current === null) pause.current = Date.now();
    if (!shouldPause && pause.current !== null) {
      dispatch({ type: 'RESUME', duration: Date.now() - pause.current });
      pause.current = null;
      setNow(Date.now());
    }
  };

  const show = (type) => {
    dialog.current = !!type;
    reconcilePause();
    setModal(type);
  };

  useEffect(() => {
    const id = setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (pause.current === null) dispatch({ type: 'TIMEOUT', now: time });
    }, 250);
    const listener = AppState.addEventListener('change', (status) => {
      background.current = status !== 'active';
      reconcilePause();
    });
    let alive = true;
    AsyncStorage.getItem(BONUS_KEY)
      .then((raw) => {
        let stored = raw ? JSON.parse(raw) : null;
        if (!stored || !Number.isFinite(stored.next) || !Number.isInteger(stored.coins) || stored.coins < 0) {
          stored = { next: Date.now() + (2 * 3600 + 14 * 60 + 33) * 1000, coins: 0 };
        }
        if (alive) setBonus(stored);
      })
      .catch(() => {
        if (alive) {
          setBonus({ next: Date.now() + (2 * 3600 + 14 * 60 + 33) * 1000, coins: 0 });
          setStorageError('Bonus storage is unavailable. Claims may not persist.');
        }
      });
    return () => {
      alive = false;
      clearInterval(id);
      listener.remove();
    };
  }, []);

  const { updateProfileData, userProfile, refreshProfile } = useAuth();
  const mountStreakRecorded = useRef(false);

  useEffect(() => {
    setActiveMatch({
      gameId: 'ludo',
      gameName: 'Lúùdò Game',
      targetScreen: 'LudoGame',
      durationSecs: 120,
    });
    if (!mountStreakRecorded.current) {
      mountStreakRecorded.current = true;
      recordGameStreak(updateProfileData, userProfile);
    }
  }, []);

  useEffect(() => {
    if (state.phase === 'won') {
      clearActiveMatch();
      if (!wonReported.current) {
        wonReported.current = true;
        recordGameStreak(updateProfileData, userProfile);
        if (onWin) onWin(state.winner === 0);
      }
    }
  }, [state.phase]);

  // Automatic AI Bot (Oba) Turn Controller & Dice Rolling
  useEffect(() => {
    if (state.phase === 'won') return;

    if (state.turn !== 0) {
      if (state.phase === 'roll' && !rollingDice) {
        const rollTimer = setTimeout(() => {
          setRollingDice(true);
          let count = 0;
          const animInterval = setInterval(() => {
            setAnimDice([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]);
            count++;
            if (count >= 8) {
              clearInterval(animInterval);
              setRollingDice(false);
              const d1 = 1 + Math.floor(Math.random() * 6);
              const d2 = 1 + Math.floor(Math.random() * 6);
              dispatch({ type: 'ROLL', dice: [d1, d2] });
            }
          }, 80);
        }, 700);
        return () => clearTimeout(rollTimer);
      }

      if (state.phase === 'no_moves') {
        const passTimer = setTimeout(() => {
          dispatch({ type: 'PASS_TURN' });
        }, 1600);
        return () => clearTimeout(passTimer);
      }

      if (state.phase === 'move') {
        const activeDifficulty = getAiDifficulty(userProfile, aiDifficulty);
        const aiTimer = setTimeout(() => {
          const allMoves = [];
          for (const d of state.available) {
            const legalTokens = legal(state, d);
            for (const t of legalTokens) {
              const p = state.tokens[state.turn][t];
              const target = p < 0 ? 0 : p + state.dice[d];
              const capture =
                target < 43 &&
                !SAFE.has(globalIndex(state.turn, target)) &&
                state.tokens.some(
                  (team, player) =>
                    player !== state.turn &&
                    team.some((v) => v >= 0 && v < 43 && globalIndex(player, v) === globalIndex(state.turn, target))
                );
              const isSafeSquare = target < 43 && SAFE.has(globalIndex(state.turn, target));
              let score = target === FINISH ? 1000 : capture ? 500 : p < 0 ? 200 : target;
              if (activeDifficulty === 'hard') {
                score = target === FINISH ? 1200 : capture ? 800 : isSafeSquare ? score + 150 : p < 0 ? 300 : target;
              }
              allMoves.push({ die: d, token: t, score });
            }
          }

          let best = null;
          if (allMoves.length > 0) {
            if (activeDifficulty === 'easy' && Math.random() < 0.45) {
              best = allMoves[Math.floor(Math.random() * allMoves.length)];
            } else {
              allMoves.sort((a, b) => b.score - a.score);
              best = allMoves[0];
            }
          }

          if (best) {
            dispatch({ type: 'SELECT', index: best.die });
            setTimeout(() => {
              dispatch({ type: 'MOVE', token: best.token });
            }, 500);
          } else {
            dispatch({ type: 'PASS_TURN' });
          }
        }, 1000);

        return () => clearTimeout(aiTimer);
      }
    } else {
      if (state.phase === 'no_moves') {
        const passTimer = setTimeout(() => {
          dispatch({ type: 'PASS_TURN' });
        }, 1800);
        return () => clearTimeout(passTimer);
      }
    }
  }, [state.turn, state.phase, state.available, state.dice, rollingDice]);

  const handleRollDice = () => {
    if (state.phase === 'won') {
      reset();
      return;
    }
    if (state.turn !== 0 || state.phase !== 'roll' || rollingDice) return;
    setRollingDice(true);
    let count = 0;
    const animInterval = setInterval(() => {
      setAnimDice([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]);
      count++;
      if (count >= 8) {
        clearInterval(animInterval);
        setRollingDice(false);
        const d1 = 1 + Math.floor(Math.random() * 6);
        const d2 = 1 + Math.floor(Math.random() * 6);
        dispatch({ type: 'ROLL', dice: [d1, d2] });
      }
    }, 80);
  };

  const claim = async () => {
    if (!bonus || Date.now() < bonus.next || bonusLock.current) return;
    bonusLock.current = true;
    try {
      // Real backend grant — idempotent per claim per UTC day.
      if (userProfile?.id || userProfile?.uid) {
        const res = await wallet.freeCoins('ludo-bonus');
        const next = { coins: res?.coins ?? bonus.coins + 100, next: Date.now() + 86400000 };
        setBonus(next);
        if (res?.granted) {
          Alert.alert('Bonus claimed', `${res.amountKobo != null ? res.amountKobo / 100 : 100} practice coins added to your account.`);
          if (refreshProfile) refreshProfile().catch(() => { });
        } else {
          Alert.alert('Already claimed', 'You already claimed the Ludo bonus today. Come back tomorrow!');
        }
      } else {
        // Offline / signed-out fallback: local only.
        const next = { coins: (bonus?.coins ?? 0) + 100, next: Date.now() + 86400000 };
        setBonus(next);
        Alert.alert('Bonus claimed', '100 local practice coins added.');
      }
    } catch (err) {
      setStorageError('Could not claim the bonus. Please try again.');
    } finally {
      bonusLock.current = false;
    }
  };

  useEffect(() => {
    if (bonus) AsyncStorage.setItem(BONUS_KEY, JSON.stringify(bonus)).catch(() => setStorageError('Bonus changes could not be saved.'));
  }, [bonus]);

  function Player({ p, x, y, w, reverse = false }) {
    const color = COLORS[p];
    return (
      <Button label={`${NAMES[p]}${state.turn === p ? ', current player' : ''}`} onPress={() => show(`player${p}`)} style={rect(x, y, w, 140)}>
        <LinearGradient
          colors={[color + 'cc', '#071454']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            position: 'absolute',
            left: reverse ? 0 : 60 * k,
            right: reverse ? 60 * k : 0,
            top: 7 * k,
            bottom: 7 * k,
            borderRadius: 60 * k,
            borderWidth: 2 * k,
            borderColor: color,
            paddingLeft: (reverse ? 24 : 82) * k,
            paddingRight: (reverse ? 82 : 24) * k,
            justify: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {reverse && ico('trophy', 35, '#ffe126')}
            {text(NAMES[p], 29)}
            {!reverse && ico('trophy', 35, '#ffe126')}
          </View>
          <View style={{ height: 2 * k, backgroundColor: color + '66', marginVertical: 12 * k }} />
          <View style={{ flexDirection: 'row', gap: 8 * k, justifyContent: reverse ? 'flex-end' : 'flex-start' }}>
            {state.tokens[p].map((n, i) => (
              <View
                key={i}
                style={{
                  width: 29 * k,
                  height: 29 * k,
                  borderRadius: 16 * k,
                  backgroundColor: n === FINISH ? '#fff' : color,
                  borderWidth: 2 * k,
                  borderColor: state.turn === p ? '#ffffffaa' : color,
                }}
              />
            ))}
          </View>
        </LinearGradient>
        <View
          style={{
            position: 'absolute',
            left: reverse ? undefined : 0,
            right: reverse ? 0 : undefined,
            width: 140 * k,
            height: 140 * k,
            borderRadius: 70 * k,
            borderWidth: 4 * k,
            borderColor: color,
            overflow: 'hidden',
          }}
        >
          <Art name={`p${p}`} w={132 * k} h={132 * k} />
        </View>
      </Button>
    );
  }

  const reset = () =>
    Alert.alert('Start a new local game?', 'This clears the current match and undo history. Your bonus coins remain.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'New game',
        onPress: () => {
          wonReported.current = false;
          if (pause.current !== null) pause.current = Date.now();
          dispatch({ type: 'RESET' });
          setChat([]);
          show(null);
        },
      },
    ]);

  function DialogContent() {
    if (modal === 'rules') return <><Text style={ui.title}>Rules</Text><Text style={ui.body}>{RULES}</Text></>;
    if (modal === 'menu')
      return (
        <>
          <Text style={ui.title}>Local game menu</Text>
          <Text style={ui.body}>Room 458721 · 4 local seats{'\n'}Pass this device between players. The match pauses while this menu is open.</Text>
          <Action label="Resume game" onPress={() => show(null)} />
          <Action label="New game" onPress={reset} />
          <Action label="Read rules" onPress={() => show('rules')} />
          {onBack && <Action label="Exit game" onPress={onBack} />}
        </>
      );
    if (modal === 'settings')
      return (
        <>
          <Text style={ui.title}>Settings</Text>
          <View style={ui.row}>
            <Text style={ui.body}>Move hints</Text>
            <Switch value={hints} onValueChange={setHints} accessibilityLabel="Enable move hints" />
          </View>
          <Text style={ui.body}>Four-player local mode. Timer: 2:45 per turn. Use the Rules panel for the exact two-dice variant.</Text>
          <Action label="Restart match" onPress={reset} />
        </>
      );
    if (modal === 'bonus')
      return (
        <>
          <Text style={ui.title}>Daily Bonus</Text>
          <Text style={ui.body}>
            Practice coins: {userProfile?.coins ?? bonus?.coins ?? 0}{'\n'}
            Next bonus: {bonus ? clock((bonus.next - Date.now()) / 1000, true) : 'Loading…'}{'\n'}
            Claim 100 local practice coins every 24 hours. These have no cash value.
          </Text>
          <Action label="Claim 100 coins" disabled={!bonus || Date.now() < bonus.next} onPress={claim} />
          {!!storageError && <Text style={ui.error}>{storageError}</Text>}
        </>
      );
    if (modal === 'chat')
      return (
        <>
          <Text style={ui.title}>Table Chat · local</Text>
          <Text style={ui.body}>Messages stay on this device for this match. Sending uses the active player’s name.</Text>
          {chat.length === 0 && <Text style={ui.body}>No messages yet.</Text>}
          {chat.map((m) => (
            <View key={m.id} style={ui.message}>
              <Text style={{ color: COLORS[m.player], fontWeight: '700' }}>{NAMES[m.player]}</Text>
              <Text style={ui.body}>{m.text}</Text>
            </View>
          ))}
          <TextInput
            style={ui.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message…"
            placeholderTextColor="#b3bbed"
            accessibilityLabel="Chat message"
            maxLength={280}
          />
          <Action
            label="Send message"
            disabled={!draft.trim()}
            onPress={() => {
              setChat((old) => [...old, { id: `${Date.now()}-${Math.random()}`, player: state.turn, text: draft.trim() }].slice(-100));
              setDraft('');
            }}
          />
        </>
      );
    if (modal?.startsWith('player')) {
      const p = Number(modal.slice(-1));
      return (
        <>
          <Text style={ui.title}>{NAMES[p]}</Text>
          <Text style={ui.body}>
            Color: {['Red', 'Green', 'Yellow', 'Blue'][p]}{'\n'}
            Tokens at home: {state.tokens[p].filter((n) => n === FINISH).length}/4{'\n'}
            Tokens in yard: {state.tokens[p].filter((n) => n < 0).length}/4{'\n'}
            {state.turn === p ? 'It is your turn.' : 'Waiting for your turn.'}
          </Text>
        </>
      );
    }
    return null;
  }

  return (
    <View style={[ui.root, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <StatusBar barStyle="light-content" backgroundColor="#2521ac" />
      {onBack && (
        <Pressable onPress={onBack} style={ui.backHeaderBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 6 }}>Back</Text>
        </Pressable>
      )}
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }} maximumZoomScale={2} minimumZoomScale={1} bouncesZoom>
        <ScrollView horizontal contentContainerStyle={{ alignItems: 'center' }} showsHorizontalScrollIndicator={false}>
          <LinearGradient colors={['#3426cc', '#151578', '#2925b4']} style={{ width: sceneSize, height: sceneSize }}>
            {[[-80, -80, 230], [1130, -50, 240], [-100, 930, 270], [1120, 1080, 220]].map(([x, y, r], i) => (
              <View key={i} style={[rect(x, y, r, r), { borderRadius: r * k, backgroundColor: '#652aff44' }]} />
            ))}
            <Button label="Menu" onPress={() => show('menu')} style={[rect(20, 22, 90, 94), ui.round, { borderRadius: 50 * k, borderWidth: 4 * k }]}>
              {ico('menu', 60)}
            </Button>
            <Button label="Settings" onPress={() => show('settings')} style={[rect(1146, 22, 90, 94), ui.round, { borderRadius: 50 * k, borderWidth: 4 * k }]}>
              {ico('settings-sharp', 54)}
            </Button>
            <View style={rect(482, 5, 297, 192)}>
              <Art name="logo" w={297 * k} h={192 * k} />
            </View>
            <Player p={0} x={112} y={57} w={350} />
            <Player p={1} x={792} y={57} w={350} reverse />
            <View style={rect(22, 676, 157, 244)}>
              <Art name="left" w={157 * k} h={244 * k} />
            </View>
            <View style={[rect(194, 203, 864, 748), { borderWidth: 5 * k, borderColor: '#1664d4', borderRadius: 51 * k, backgroundColor: '#073b9a', padding: 12 * k }]}>
              <View style={{ flex: 1, transform: [{ scaleY: 710 / 828 }], marginTop: -59 * k, marginBottom: -59 * k, justifyContent: 'center' }}>
                <Board
                  size={828 * k}
                  state={state}
                  onMove={(token) => dispatch({ type: 'MOVE', token })}
                />
              </View>
            </View>
            <View style={[rect(1077, 252, 160, 160), ui.round, { borderWidth: 6 * k, borderColor: '#168dff', borderRadius: 90 * k }]}>
              {ico('stopwatch-outline', 59, '#00c8ff')}
              {text(clock(((pause.current ?? now) < state.deadline ? state.deadline - (pause.current ?? now) : 0) / 1000), 39)}
            </View>
            {[
              ['Rules', 'book', 'rules', 452],
              ['Chat', 'chatbubble-ellipses', 'chat', 551],
            ].map(([label, name, target, y]) => (
              <Button key={target} label={label} onPress={() => show(target)} style={[rect(1078, y, 157, 78), ui.round, { borderRadius: 32 * k, borderWidth: 4 * k, flexDirection: 'row', gap: 15 * k }]}>
                {ico(name, 35)}
                {text(label, 26)}
              </Button>
            ))}
            <View style={rect(1086, 674, 149, 250)}>
              <Art name="right" w={149 * k} h={250 * k} />
            </View>
            <Player p={2} x={30} y={967} w={385} />
            <Player p={3} x={838} y={967} w={386} reverse />
            <View style={[rect(434, 962, 386, 137), ui.round, { borderRadius: 66 * k, borderWidth: 5 * k, flexDirection: 'row', justifyContent: 'space-evenly' }]}>
              {ico('chevron-back', 55, '#1262ef')}
              {state.dice.map((value, index) => (
                <Die
                  key={index}
                  index={index}
                  value={rollingDice ? animDice[index] : value}
                  size={89 * k}
                  selected={state.phase === 'move' && state.selected === index}
                  used={state.phase === 'move' && !state.available.includes(index)}
                  onPress={() => dispatch({ type: 'SELECT', index })}
                />
              ))}
              {ico('chevron-forward', 55, '#1262ef')}
            </View>
            <Button label="Undo last roll or move" onPress={() => dispatch({ type: 'UNDO' })} disabled={!state.history.length || state.turn !== 0} style={[rect(88, 1122, 271, 92), ui.round, { borderRadius: 46 * k, borderWidth: 5 * k, flexDirection: 'row', gap: 23 * k }]}>
              {ico('arrow-undo', 45, '#ffe52b')}
              {text('UNDO', 28)}
            </Button>
            <Button
              label={state.phase === 'won' ? 'Start new game' : rollingDice ? 'Rolling dice...' : state.turn !== 0 ? `${NAMES[state.turn]}'s Turn` : 'Roll both dice'}
              disabled={state.phase === 'move' || state.turn !== 0 || rollingDice}
              onPress={handleRollDice}
              style={rect(435, 1118, 385, 98)}
            >
              <LinearGradient colors={state.turn !== 0 ? ['#64748B', '#475569', '#334155'] : ['#fff147', '#ffc600', '#ffab00']} style={{ flex: 1, borderRadius: 50 * k, borderWidth: 5 * k, borderColor: state.turn !== 0 ? '#94A3B8' : '#ffe950', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24 * k }}>
                {ico(rollingDice || state.turn !== 0 ? 'sync' : 'play', 48, state.turn !== 0 ? '#FFF' : '#402500')}
                {text(state.phase === 'won' ? 'NEW GAME' : rollingDice ? 'ROLLING...' : state.turn !== 0 ? `${NAMES[state.turn].toUpperCase()}'S TURN` : 'ROLL DICE', 32, { color: state.turn !== 0 ? '#FFF' : '#281a00', fontWeight: '900' })}
              </LinearGradient>
            </Button>
            <Button label="Show best move hint" disabled={!hints || state.phase === 'won'} onPress={() => dispatch({ type: 'HINT' })} style={[rect(897, 1122, 270, 92), ui.round, { borderRadius: 46 * k, borderWidth: 5 * k, flexDirection: 'row', gap: 24 * k }]}>
              {ico('bulb', 48, '#ffe32a')}
              {text('HINT', 28)}
            </Button>
          </LinearGradient>
        </ScrollView>
        <Text accessibilityLiveRegion="polite" style={[ui.status, { maxWidth: sceneSize }]}>
          {state.message}
        </Text>
        {state.phase === 'move' && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, paddingBottom: 8 }}>
            {legal(state).map((t) => (
              <Button key={t} label={`Move token ${t + 1} with die ${state.dice[state.selected]}`} onPress={() => dispatch({ type: 'MOVE', token: t })} style={ui.move}>
                <Text style={{ color: '#fff' }}>Move token {t + 1}</Text>
              </Button>
            ))}
          </View>
        )}
      </ScrollView>
      <Modal visible={!!modal} transparent animationType="fade" onRequestClose={() => show(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={ui.backdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => show(null)} accessibilityRole="button" accessibilityLabel="Close panel" />
          <View accessibilityViewIsModal style={ui.dialog}>
            <Button label="Close panel" onPress={() => show(null)} style={{ alignSelf: 'flex-end', padding: 8 }}>
              <Ionicons name="close" size={28} color="#fff" />
            </Button>
            <ScrollView keyboardShouldPersistTaps="handled">{DialogContent()}</ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function Action({ label, onPress, disabled }) {
  return (
    <Button label={label} onPress={onPress} disabled={disabled} style={ui.action}>
      <Text style={{ color: '#101242', fontSize: 16, fontWeight: '700' }}>{label}</Text>
    </Button>
  );
}

const ui = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2521ac' },
  backHeaderBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, zIndex: 10 },
  round: { backgroundColor: '#10135c', borderColor: '#3757e3', alignItems: 'center', justifyContent: 'center' },
  panel: { backgroundColor: '#0e155e' },
  status: { color: '#fff', fontSize: 15, textAlign: 'center', padding: 12, lineHeight: 21 },
  move: { backgroundColor: '#174db2', padding: 12, borderRadius: 12 },
  backdrop: { flex: 1, backgroundColor: '#000a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: { maxHeight: '88%', width: '100%', maxWidth: 520, backgroundColor: '#121f68', borderRadius: 24, padding: 20, borderWidth: 2, borderColor: '#4277ff' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 12 },
  body: { fontSize: 16, lineHeight: 24, color: '#e2e8ff', marginVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  action: { backgroundColor: '#ffda18', borderRadius: 18, padding: 16, alignItems: 'center', marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#8798e5', borderRadius: 12, padding: 14, color: '#fff', fontSize: 16, marginTop: 15 },
  message: { backgroundColor: '#1e327e', padding: 12, borderRadius: 12, marginBottom: 8 },
  error: { color: '#ffbcb8', marginTop: 12 },
});
export default LudoScreen;
