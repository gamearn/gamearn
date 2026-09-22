import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { ArrowLeft, RotateCcw, Award } from 'lucide-react-native';
import { ART_HEIGHT, ART_WIDTH, AyoArtwork, AyoGradients, PIT_X, PIT_Y } from './AyoArtwork';
import {
  createAyoInitialState,
  getAyoAiMove,
  sowAyoSeeds,
} from './ayoGameEngine';
import { setActiveMatch, clearActiveMatch } from '../../utils/activeMatch';

import Svg, { G, Path, Rect } from 'react-native-svg';

function AyoBackgroundAnimation() {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 4500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 4500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const foliageOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.35],
  });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 1409 1116" preserveAspectRatio="xMidYMid slice">
        <AyoGradients />
        <Rect width="1409" height="1116" fill="url(#forest)" />
      </Svg>

      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: foliageOpacity }]}>
        <Svg width="100%" height="100%" viewBox="0 0 1409 1116" preserveAspectRatio="xMidYMid slice">
          {[0, 1].map((side) => (
            <G key={side} transform={side ? 'translate(1409 0) scale(-1 1)' : ''} fill="#3a7255">
              <Path d="M55 142 L39 0 H48 L69 103 L145 14 L160 5 L77 120Z M44 81 L0 22 L0 6 L42 50Z M82 61 Q77 2 93 0 L105 0 L99 52Z M96 75 L163 31 L173 52 L118 96Z M210 164 L265 31 L287 14 L268 79 L296 126 L275 133 L256 100 L229 172Z" />
              <Path d="M58 1116 L31 1035 L4 991 L0 958 L61 1008 L96 956 L108 969 L71 1036 L85 1116Z M120 1104 L169 1034 L176 1049 L149 1107Z" />
            </G>
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
}

function parseTimerSec(timerStr) {
  if (!timerStr) return 120;
  if (typeof timerStr === 'number') return timerStr;
  if (timerStr.endsWith('s')) return parseInt(timerStr, 10);
  if (timerStr.endsWith('m')) return parseInt(timerStr, 10) * 60;
  return 120;
}

export function AyoScreen({ timer = '2m', onWin, onBack, onHumanMove }) {
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [gameState, setGameState] = useState(createAyoInitialState);
  const [selected, setSelected] = useState(null);
  const [dice, setDice] = useState([5, 3]);
  const [rolling, setRolling] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const timerRef = useRef(null);

  const turnDuration = parseTimerSec(timer);
  const [secondsRemaining, setSecondsRemaining] = useState(turnDuration);

  // Turn Countdown
  useEffect(() => {
    if (gameState.gameStatus === 'game_over') return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : turnDuration));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.gameStatus, turnDuration]);

  useEffect(() => {
    setSecondsRemaining(turnDuration);
  }, [gameState.activePlayer, turnDuration]);

  useEffect(() => {
    setActiveMatch({
      gameId: 'ayo',
      gameName: 'Ayò Ọ̀pọ́n',
      targetScreen: 'AyoGame',
      durationSecs: 120,
    });
  }, []);

  // AI Turn Handling
  useEffect(() => {
    if (gameState.gameStatus === 'game_over') {
      clearActiveMatch();
      setDialogVisible(true);
      if (gameState.winner === 1) {
        onWin?.(500);
      }
      return;
    }

    if (gameState.activePlayer === 2) {
      const aiTimer = setTimeout(() => {
        setGameState((prev) => {
          if (prev.activePlayer !== 2 || prev.gameStatus === 'game_over') return prev;
          const bestPit = getAyoAiMove(prev);
          if (bestPit !== null) {
            return sowAyoSeeds(prev, bestPit);
          }
          return prev;
        });
      }, 1100);

      return () => clearTimeout(aiTimer);
    }
  }, [gameState.activePlayer, gameState.gameStatus]);

  function layout(event) {
    const { width, height } = event.nativeEvent.layout;
    setBounds({ width, height });
  }

  function handlePitPress(index) {
    if (gameState.gameStatus === 'game_over') return;
    if (gameState.activePlayer !== 1) {
      setGameState((prev) => ({ ...prev, statusMessage: "Wait for Oba's turn!" }));
      return;
    }

    onHumanMove?.(index);
    setSelected(index);
    setGameState((prev) => sowAyoSeeds(prev, index));
  }

  function roll() {
    if (timer.current) return;
    setRolling(true);
    let frames = 0;
    timer.current = setInterval(() => {
      const result = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
      setDice(result);
      if (++frames === 9) {
        clearInterval(timer.current);
        timer.current = null;
        setRolling(false);
      }
    }, 90);
  }

  function handleRestart() {
    setGameState(createAyoInitialState());
    setSelected(null);
    setDialogVisible(false);
  }

  const effectiveWidth = bounds.width || (typeof window !== 'undefined' ? window.innerWidth : 380);
  const effectiveHeight = bounds.height || (typeof window !== 'undefined' ? window.innerHeight : 700);

  let scale = 0;
  let width = 0;
  let height = 0;

  if (effectiveWidth > 0 && effectiveHeight > 0) {
    const availableWidth = effectiveWidth * 0.96;
    const availableHeight = Math.max(100, effectiveHeight - 110);
    scale = Math.min(availableWidth / ART_WIDTH, availableHeight / ART_HEIGHT);
    width = ART_WIDTH * scale;
    height = ART_HEIGHT * scale;
  }

  return (
    <View onLayout={layout} style={styles.root}>
      <AyoBackgroundAnimation />

      {/* Top Navigation Bar */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>AYÒ OLOPON</Text>
          <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '800' }}>
            ⏱️ {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, '0')}
          </Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={handleRestart}>
          <RotateCcw size={20} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      {/* Top Player Profile HUD (AI Bot) */}
      <View style={styles.playerHudTop}>
        <View style={[styles.playerCard, gameState.activePlayer === 2 && styles.activePlayerGlow]}>
          <Text style={styles.avatarEmoji}>🤖</Text>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>Oba (Top Row)</Text>
            <Text style={styles.scoreText}>
              Seeds Captured: <Text style={styles.scoreValue}>{gameState.scores[1]}</Text> / 24
            </Text>
          </View>
          {gameState.activePlayer === 2 && (
            <View style={styles.turnBadge}>
              <Text style={styles.turnText}>THINKING...</Text>
            </View>
          )}
        </View>
      </View>

      {scale > 0 && (
        <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
          {/* Main SVG Board Artwork */}
          <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <AyoArtwork
              width={width}
              height={height}
              pits={gameState.pits}
              scores={gameState.scores}
              dice={dice}
              selected={selected}
              rolling={rolling}
            />
          </View>

          {/* Status Message Overlay Banner */}
          <View style={{ position: 'absolute', top: 380 * scale, left: 100 * scale, width: 1200 * scale, alignItems: 'center' }}>
            <View style={{ backgroundColor: '#03271ddd', paddingHorizontal: 24 * scale, paddingVertical: 10 * scale, borderRadius: 24 * scale, borderWidth: 2 * scale, borderColor: '#F59E0B' }}>
              <Text style={{ color: '#FFF', fontSize: 26 * scale, fontWeight: '800', textAlign: 'center' }}>
                {gameState.statusMessage}
              </Text>
            </View>
          </View>

          {/* Interactive Pit Touch Targets */}
          {PIT_Y.map((y, row) => PIT_X.map((x, col) => {
            const index = row * 6 + col;
            return (
              <Pressable
                key={index}
                accessibilityRole="button"
                onPress={() => handlePitPress(index)}
                style={({ pressed }) => ({
                  position: 'absolute',
                  left: (x - 79) * scale,
                  top: (y - 79) * scale,
                  width: 158 * scale,
                  height: 158 * scale,
                  borderRadius: 79 * scale,
                  backgroundColor: pressed ? '#ffdc6644' : 'transparent',
                  borderColor: selected === index ? '#F59E0B' : 'transparent',
                  borderWidth: selected === index ? 3 * scale : 0,
                  cursor: 'pointer',
                })}
              />
            );
          }))}

          {/* Dice Tray Roller */}
          <Pressable
            accessibilityRole="button"
            disabled={rolling}
            onPress={roll}
            style={({ pressed }) => ({
              position: 'absolute',
              left: 527 * scale,
              top: 432 * scale,
              width: 354 * scale,
              height: 354 * scale,
              borderRadius: 177 * scale,
              backgroundColor: pressed ? '#ffdc6622' : 'transparent',
              cursor: 'pointer',
            })}
          />
        </View>
      )}

      {/* Bottom Player Profile HUD (You - Player 1) */}
      <View style={styles.playerHudBottom}>
        <View style={[styles.playerCard, gameState.activePlayer === 1 && styles.activePlayerGlow]}>
          <Text style={styles.avatarEmoji}>👑</Text>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>You (Bottom Row)</Text>
            <Text style={styles.scoreText}>
              Seeds Captured: <Text style={styles.scoreValue}>{gameState.scores[0]}</Text> / 24
            </Text>
          </View>
          {gameState.activePlayer === 1 && (
            <View style={[styles.turnBadge, { backgroundColor: '#10B981' }]}>
              <Text style={styles.turnText}>YOUR TURN</Text>
            </View>
          )}
        </View>
      </View>

      {/* Game Over Victory Modal */}
      <Modal visible={dialogVisible} transparent animationType="fade" onRequestClose={() => setDialogVisible(false)}>
        <View style={styles.scrim}>
          <View style={styles.dialog}>
            <Text style={styles.title}>{gameState.winner === 1 ? '🏆 VICTORY!' : '💔 GAME OVER'}</Text>
            <Text style={styles.body}>{gameState.statusMessage}</Text>
            <Text style={[styles.body, { color: '#F59E0B', fontWeight: '800' }]}>
              Final Score: You ({gameState.scores[0]}) - Oba ({gameState.scores[1]})
            </Text>
            <Pressable style={styles.button} onPress={handleRestart}>
              <Text style={styles.buttonText}>🎮 Play Again</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#03271d',
    overflow: 'hidden',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    zIndex: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(3, 39, 29, 0.85)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  playerHudTop: {
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  playerHudBottom: {
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    maxWidth: 380,
    backgroundColor: 'rgba(6, 64, 48, 0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  activePlayerGlow: {
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  scoreText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  scoreValue: {
    color: '#F59E0B',
    fontWeight: '900',
    fontSize: 13,
  },
  turnBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  turnText: {
    color: '#03271d',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scrim: {
    flex: 1,
    backgroundColor: '#000000aa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#064030',
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#e2f5ee',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#03271d',
  },
});
