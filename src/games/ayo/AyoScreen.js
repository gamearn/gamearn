import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { ArrowLeft, RotateCcw, Award } from 'lucide-react-native';
import { ART_HEIGHT, ART_WIDTH, AyoArtwork, AyoGradients, PIT_X, PIT_Y, pitIndexAt, pitPosition, Seed } from './AyoArtwork';
import { ayoView, serverPitIndex } from './ayoPresentation';

import Svg, { G, Path, Rect } from 'react-native-svg';

function AyoBackgroundAnimation() {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
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
    );
    animation.start();
    return () => animation.stop();
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

export function AyoScreen({ secondsRemaining, update, uid, canMove, pending, status, onComplete, onBack, onHumanMove, onRestart }) {
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [gameState, setGameState] = useState(null);
  const [sowing, setSowing] = useState(null);
  const flight = useRef(new Animated.Value(0)).current;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!update) return;
    let cancelled = false;
    let timeout;
    const result = ayoView(update.snapshot, uid);
    const steps = update.animate ? result.steps : [];
    const finish = () => {
      if (cancelled) return;
      setSowing(null);
      setGameState(result);
      onCompleteRef.current(update.id);
    };
    const play = (index) => {
      if (cancelled) return;
      if (index >= steps.length) {
        timeout = setTimeout(finish, 450);
        return;
      }
      const next = steps[index];
      const previous = steps[index - 1];
      if (next.phase === 'pickup' || !previous) {
        setSowing({ ...next, from: next.pitIndex, to: next.pitIndex, flying: false, player: result.movingPlayer });
        timeout = setTimeout(() => play(index + 1), 300);
        return;
      }
      flight.setValue(0);
      setSowing({ ...previous, from: previous.pitIndex, to: next.pitIndex, flying: true, player: result.movingPlayer });
      Animated.timing(flight, {
        toValue: 1, duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || cancelled) return;
        setSowing({ ...next, from: next.pitIndex, to: next.pitIndex, flying: false, player: result.movingPlayer });
        timeout = setTimeout(() => play(index + 1), 90);
      });
    };
    if (steps.length) play(0);
    else finish();
    return () => { cancelled = true; clearTimeout(timeout); flight.stopAnimation(); };
  }, [update, uid, flight]);

  function layout(event) {
    const { width, height } = event.nativeEvent.layout;
    setBounds({ width, height });
  }

  function handlePitPress(index) {
    if (!canMove || sowing || !gameState) return;
    onHumanMove(serverPitIndex(index, gameState.playerIndex));
  }

  if (!gameState) return <View style={styles.root}><Text style={styles.playerName}>Waiting for the server board...</Text></View>;
  const activePlayer = sowing?.player || gameState.activePlayer;

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

  return (
    <View onLayout={layout} style={styles.root}>
      <AyoBackgroundAnimation />

      {/* Top Navigation Bar */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>AYO OLOPON</Text>
          <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '800' }}>
            {secondsRemaining == null ? 'Connecting to clock...' : `Time left ${Math.floor(secondsRemaining / 60)}:${String(secondsRemaining % 60).padStart(2, '0')}`}
          </Text>
        </View>
        {onRestart ? <TouchableOpacity style={styles.iconBtn} onPress={onRestart} disabled={pending || !!sowing}>
          <RotateCcw size={20} color="#F59E0B" />
        </TouchableOpacity> : <View style={{ width: 38 }} />}
      </View>

      {/* Top Player Profile HUD (AI Bot) */}
      <View style={styles.playerHudTop}>
        <View style={[styles.playerCard, activePlayer === 2 && styles.activePlayerGlow]}>
          <Award size={22} color="#F59E0B" style={{ marginRight: 10 }} />
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{gameState.opponentName}</Text>
            <Text style={styles.scoreText}>
              Seeds Captured: <Text style={styles.scoreValue}>{gameState.scores[1]}</Text> / 24
            </Text>
          </View>
          {activePlayer === 2 && (
            <View style={styles.turnBadge}>
              <Text style={styles.turnText}>{sowing ? 'SOWING...' : 'WAITING...'}</Text>
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
              pits={Array.from({ length: 12 }, (_, i) => (sowing?.pits || gameState.pits)[i < 6 ? i + 6 : 11 - i])}
              scores={gameState.scores}
              selected={sowing ? (sowing.to < 6 ? 11 - sowing.to : sowing.to - 6) : null}
              activePit={sowing ? (sowing.to < 6 ? 11 - sowing.to : sowing.to - 6) : null}
            />
          </View>

          {/* Status Message Overlay Banner */}
          <View style={{ position: 'absolute', top: 380 * scale, left: 100 * scale, width: 1200 * scale, alignItems: 'center' }}>
            <View style={{ backgroundColor: '#03271ddd', paddingHorizontal: 24 * scale, paddingVertical: 10 * scale, borderRadius: 24 * scale, borderWidth: 2 * scale, borderColor: '#F59E0B' }}>
              <Text style={{ color: '#FFF', fontSize: 26 * scale, fontWeight: '800', textAlign: 'center' }}>
                {sowing ? `${sowing.remaining} seeds left to sow` : (pending ? 'Waiting for server confirmation...' : gameState.statusMessage)}
              </Text>
            </View>
          </View>

          {/* Interactive Pit Touch Targets */}
          {PIT_Y.map((y, row) => PIT_X.map((x, col) => {
            const index = pitIndexAt(row, col);
            return (
              <Pressable
                key={index}
                accessibilityRole="button"
                accessibilityLabel={`${row === 1 ? 'Your' : gameState.opponentName + "'s"} pit ${col + 1}, ${(sowing?.pits || gameState.pits)[index]} seeds`}
                disabled={!canMove || !!sowing || row !== 1 || gameState.pits[index] === 0}
                onPress={() => handlePitPress(index)}
                style={({ pressed }) => ({
                  position: 'absolute',
                  left: (x - 79) * scale,
                  top: (y - 79) * scale,
                  width: 158 * scale,
                  height: 158 * scale,
                  borderRadius: 79 * scale,
                  backgroundColor: pressed ? '#ffdc6644' : 'transparent',
                  borderColor: sowing?.to === index ? '#F59E0B' : 'transparent',
                  borderWidth: sowing?.to === index ? 3 * scale : 0,
                  cursor: 'pointer',
                })}
              />
            );
          }))}

          {sowing?.flying && (
            <Animated.View pointerEvents="none" style={{
              position: 'absolute', left: 0, top: 0,
              width: 64 * scale, height: 64 * scale,
              transform: [
                { translateX: flight.interpolate({ inputRange: [0, 1], outputRange: [pitPosition(sowing.from).x * scale - 32 * scale, pitPosition(sowing.to).x * scale - 32 * scale] }) },
                { translateY: flight.interpolate({ inputRange: [0, 0.5, 1], outputRange: [pitPosition(sowing.from).y * scale - 32 * scale, (pitPosition(sowing.from).y + pitPosition(sowing.to).y) * scale / 2 - 100 * scale, pitPosition(sowing.to).y * scale - 32 * scale] }) },
              ],
            }}>
              <Svg width="100%" height="100%" viewBox="0 0 64 64">
                <AyoGradients />
                <Seed x={32} y={32} angle={-25} scale={1.2} />
              </Svg>
            </Animated.View>
          )}


        </View>
      )}

      {/* Bottom Player Profile HUD (You - Player 1) */}
      <View style={styles.playerHudBottom}>
        <View style={[styles.playerCard, activePlayer === 1 && styles.activePlayerGlow]}>
          <Award size={22} color="#F59E0B" style={{ marginRight: 10 }} />
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>You (Bottom Row)</Text>
            <Text style={styles.scoreText}>
              Seeds Captured: <Text style={styles.scoreValue}>{gameState.scores[0]}</Text> / 24
            </Text>
          </View>
          {activePlayer === 1 && (
            <View style={[styles.turnBadge, { backgroundColor: '#10B981' }]}>
              <Text style={styles.turnText}>{sowing ? 'SOWING...' : 'YOUR TURN'}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={{ color: '#FFF3CD', fontSize: 13, textAlign: 'center', minHeight: 20 }}>
        {sowing ? `${activePlayer === 1 ? 'You' : gameState.opponentName} sowing: ${sowing.remaining} seeds in hand` : (pending ? 'Waiting for server confirmation...' : gameState.statusMessage)}
      </Text>
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
