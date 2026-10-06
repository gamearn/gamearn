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
import { ART_HEIGHT, ART_WIDTH, AyoArtwork, AyoGradients, PITS_CONFIG } from './AyoArtwork';
import {
  createAyoInitialState,
  getAyoAiMove,
  getAyoMoveSteps,
  isValidAyoMove,
} from './ayoGameEngine';
import { setActiveMatch, clearActiveMatch, getActiveMatch, updateActiveMatchState } from '../../utils/activeMatch';
import { useAuth } from '../../context/AuthContext';
import { recordGameStreak } from '../../utils/recordGameStreak';
import { getAiDifficulty } from '../../utils/aiDifficulty';

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

export function AyoScreen({ timer = '2m', seedCount = 4, onWin, onBack, onHumanMove, aiDifficulty = 'auto' }) {
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [gameState, setGameState] = useState(() => createAyoInitialState(seedCount));
  const [selected, setSelected] = useState(null);
  const [activePit, setActivePit] = useState(null);
  const [capturedPits, setCapturedPits] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);

  const gameStateRef = useRef(gameState);
  const animTimerRef = useRef(null);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const turnDuration = parseTimerSec(timer);
  const [secondsRemaining, setSecondsRemaining] = useState(turnDuration);

  // Turn Countdown & Timeout forfeit handling
  useEffect(() => {
    if (gameState.gameStatus === 'game_over' || isAnimating) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Timeout! Pass turn to opponent
          setGameState((current) => {
            if (current.gameStatus === 'game_over') return current;
            const nextPlayer = current.activePlayer === 1 ? 2 : 1;
            const msg = current.activePlayer === 1
              ? "⏱️ Time's up! Turn passed to Oba."
              : "⏱️ Oba timed out! Your turn.";
            return {
              ...current,
              activePlayer: nextPlayer,
              statusMessage: msg,
            };
          });
          return turnDuration;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.gameStatus, isAnimating, turnDuration]);

  useEffect(() => {
    setSecondsRemaining(turnDuration);
  }, [gameState.activePlayer, turnDuration]);

  const { updateProfileData, userProfile } = useAuth();
  const mountStreakRecorded = useRef(false);
  const gameOverStreakRecorded = useRef(false);

  useEffect(() => {
    let alive = true;
    getActiveMatch().then((match) => {
      if (alive && match?.gameId === 'ayo' && match?.savedState && match.savedState.gameStatus !== 'game_over') {
        setGameState(match.savedState);
      } else {
        setActiveMatch({
          gameId: 'ayo',
          gameName: 'Ayò Ọ̀pọ́n',
          targetScreen: 'AyoGame',
          durationSecs: 120,
        });
      }
    });

    if (!mountStreakRecorded.current) {
      mountStreakRecorded.current = true;
      recordGameStreak(updateProfileData, userProfile);
    }
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    return () => {
      if (animTimerRef.current) {
        clearInterval(animTimerRef.current);
        animTimerRef.current = null;
      }
    };
  }, []);

  const executeAnimatedMove = (pitIndex) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSelected(pitIndex);

    const { steps, finalState } = getAyoMoveSteps(gameStateRef.current, pitIndex);
    if (!steps || steps.length === 0) {
      setGameState(finalState);
      setIsAnimating(false);
      setSelected(null);
      return;
    }

    let stepIdx = 0;
    animTimerRef.current = setInterval(() => {
      if (stepIdx < steps.length) {
        const step = steps[stepIdx];
        setGameState((prev) => ({
          ...prev,
          pits: step.pits,
          scores: step.scores,
          statusMessage: step.message,
        }));
        setActivePit(step.activePit);
        setCapturedPits(step.capturedPits || []);
        stepIdx++;
      } else {
        clearInterval(animTimerRef.current);
        animTimerRef.current = null;
        setTimeout(() => {
          setActivePit(null);
          setCapturedPits([]);
          setSelected(null);
          setGameState(finalState);
          gameStateRef.current = finalState;
          setIsAnimating(false);
        }, 350);
      }
    }, 240);
  };

  // AI Turn Handling & Game Over Streak
  useEffect(() => {
    if (gameState.gameStatus === 'game_over') {
      clearActiveMatch();
      if (!gameOverStreakRecorded.current) {
        gameOverStreakRecorded.current = true;
        recordGameStreak(updateProfileData, userProfile);
        if (onWin) {
          onWin(gameState.winner === 1);
        } else {
          setDialogVisible(true);
        }
      }
      return;
    }
    if (gameState) {
      updateActiveMatchState('ayo', gameState);
    }

    if (gameState.activePlayer === 2 && !isAnimating) {
      const activeDifficulty = getAiDifficulty(userProfile, aiDifficulty);
      const aiTimer = setTimeout(() => {
        if (gameStateRef.current.activePlayer !== 2 || gameStateRef.current.gameStatus === 'game_over') return;
        const bestPit = getAyoAiMove(gameStateRef.current, activeDifficulty);
        if (bestPit !== null) {
          executeAnimatedMove(bestPit);
        }
      }, 900);

      return () => clearTimeout(aiTimer);
    }
  }, [gameState.activePlayer, gameState.gameStatus, isAnimating, aiDifficulty]);

  function layout(event) {
    const { width, height } = event.nativeEvent.layout;
    setBounds({ width, height });
  }

  function handlePitPress(index) {
    if (isAnimating || gameState.gameStatus === 'game_over') return;
    if (gameState.activePlayer !== 1) {
      setGameState((prev) => ({ ...prev, statusMessage: "Wait for Oba's turn!" }));
      return;
    }
    if (!isValidAyoMove(gameState, index)) {
      setGameState((prev) => ({ ...prev, statusMessage: "Select a valid pit on your row!" }));
      return;
    }

    onHumanMove?.(index);
    executeAnimatedMove(index);
  }

  function handleRestart() {
    if (animTimerRef.current) {
      clearInterval(animTimerRef.current);
      animTimerRef.current = null;
    }
    const fresh = createAyoInitialState(seedCount);
    setGameState(fresh);
    gameStateRef.current = fresh;
    setSelected(null);
    setActivePit(null);
    setCapturedPits([]);
    setIsAnimating(false);
    setDialogVisible(false);
  }

  const effectiveWidth = bounds.width || (typeof window !== 'undefined' ? window.innerWidth : 380);
  const effectiveHeight = bounds.height || (typeof window !== 'undefined' ? window.innerHeight : 700);

  let scale = 0;
  let width = 0;
  let height = 0;

  if (effectiveWidth > 0 && effectiveHeight > 0) {
    const availableWidth = effectiveWidth * 0.96;
    const availableHeight = Math.max(100, effectiveHeight - 165);
    scale = Math.min(availableWidth / ART_WIDTH, availableHeight / ART_HEIGHT);
    width = ART_WIDTH * scale;
    height = ART_HEIGHT * scale;
  }

  const targetHalfSeeds = (gameState.seedCount || 4) * 6;

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
          <Text style={styles.avatarEmoji}>👑</Text>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>Oba (Top Row)</Text>
            <Text style={styles.scoreText}>
              Seeds Captured: <Text style={styles.scoreValue}>{gameState.scores[1]}</Text> / {targetHalfSeeds}
            </Text>
          </View>
          {gameState.activePlayer === 2 && (
            <View style={styles.turnBadge}>
              <Text style={styles.turnText}>{isAnimating ? 'SOWING...' : 'THINKING...'}</Text>
            </View>
          )}
        </View>
      </View>

      {scale > 0 && (
        <View style={{ width, height, alignItems: 'center', justifyContent: 'center', marginVertical: 2 }}>
          {/* Main SVG Board Artwork */}
          <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <AyoArtwork
              width={width}
              height={height}
              pits={gameState.pits}
              scores={gameState.scores}
              selected={selected}
              activePit={activePit}
              capturedPits={capturedPits}
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
          {PITS_CONFIG.map((pit) => (
            <Pressable
              key={pit.index}
              accessibilityRole="button"
              disabled={isAnimating || gameState.gameStatus === 'game_over' || gameState.activePlayer !== 1}
              onPress={() => handlePitPress(pit.index)}
              style={({ pressed }) => ({
                position: 'absolute',
                left: (pit.x - 79) * scale,
                top: (pit.y - 79) * scale,
                width: 158 * scale,
                height: 158 * scale,
                borderRadius: 79 * scale,
                backgroundColor: pressed ? '#ffdc6644' : 'transparent',
                borderColor: selected === pit.index ? '#F59E0B' : 'transparent',
                borderWidth: selected === pit.index ? 3 * scale : 0,
                cursor: 'pointer',
              })}
            />
          ))}
        </View>
      )}

      {/* Bottom Player Profile HUD (You - Player 1) */}
      <View style={styles.playerHudBottom}>
        <View style={[styles.playerCard, gameState.activePlayer === 1 && styles.activePlayerGlow]}>
          <Text style={styles.avatarEmoji}>👑</Text>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>You (Bottom Row)</Text>
            <Text style={styles.scoreText}>
              Seeds Captured: <Text style={styles.scoreValue}>{gameState.scores[0]}</Text> / {targetHalfSeeds}
            </Text>
          </View>
          {gameState.activePlayer === 1 && (
            <View style={[styles.turnBadge, { backgroundColor: '#10B981' }]}>
              <Text style={styles.turnText}>{isAnimating ? 'SOWING...' : 'YOUR TURN'}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#03271d',
    overflow: 'hidden',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    marginBottom: 2,
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
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 2,
  },
  playerHudTop: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 2,
    zIndex: 10,
  },
  playerHudBottom: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 2,
    zIndex: 10,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '92%',
    maxWidth: 380,
    backgroundColor: 'rgba(6, 64, 48, 0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
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
