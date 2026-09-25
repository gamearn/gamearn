import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Artwork,
  BUTTONS,
  PORTRAITS,
  Shape,
  getCardCenters,
} from './Artwork';
import {
  AI_CHAT_RESPONSES,
  createInitialState,
  drawCard,
  getAiMove,
  playCard,
  reduceStateOnTurnTimeout,
  isValidMove,
} from './whotGameEngine';
import { setActiveMatch, clearActiveMatch } from '../../utils/activeMatch';
import { engineCardToServer } from './serverAdapter';
import { useAuth } from '../../context/AuthContext';
import { recordGameStreak } from '../../utils/recordGameStreak';
import { getAiDifficulty } from '../../utils/aiDifficulty';
import { wallet } from '../../services/api';

export function Portrait({ index, scale }) {
  const c = PORTRAITS[index];
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: 'absolute',
        left: c.x * scale,
        top: c.y * scale,
        width: c.w * scale,
        height: c.h * scale,
        borderRadius: (c.w * scale) / 2,
        overflow: 'hidden',
      }}
    >
      <Image
        source={require('../../../assets/portraits-source.png')}
        resizeMode="stretch"
        style={{
          position: 'absolute',
          left: -c.x * scale,
          top: -c.y * scale,
          width: 1024 * scale,
          height: 1536 * scale,
        }}
      />
    </View>
  );
}

export function WhotScreen({ timer = '2m', onAction, onPlay, onMessage, onWin, onBack = null, isRemote = false, remote = null, onRemoteMove, onRemoteGameOver, aiDifficulty = 'auto', incomingChats = [] }) {
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [gameState, setGameState] = useState(() => createInitialState(timer));
  const [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [pendingWhotCardId, setPendingWhotCardId] = useState(null);
  const [draft, setDraft] = useState('');
  const knownChatIds = useRef(new Set());

  // Remote (server-authoritative) mode: every turn/law/effect comes from the
  // backend. Rehydrate the local render tree wholesale on each new snapshot;
  // human moves are sent to the server, never applied locally.
  useEffect(() => {
    if (!isRemote || !remote) return;
    setGameState(remote);
  }, [remote, isRemote]);

  function sendRemoteMove(move) {
    setGameState((prev) => ({ ...prev, statusMessage: 'Sending move…' }));
    onRemoteMove?.(move);
  }

  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const humanHand = gameState.players[0].hand;
  const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];

  const effectiveWidth = bounds.width || (typeof window !== 'undefined' ? window.innerWidth : 0);
  const effectiveHeight = bounds.height || (typeof window !== 'undefined' ? window.innerHeight : 0);

  const availableWidth = Math.max(100, effectiveWidth - 10) * 0.95;
  const availableHeight = Math.max(100, effectiveHeight - 75) * 0.98;

  const scale = (effectiveWidth > 0 && effectiveHeight > 0)
    ? Math.min(availableWidth / 1024, availableHeight / 1536)
    : 0;

  // Turn Timer & Daily Bonus Countdown
  useEffect(() => {
    if (gameState.gameStatus === 'game_over') return;

    const t = setInterval(() => {
      setGameState((prev) => {
        const nextBonus = Math.max(0, prev.dailyBonusSeconds - 1);
        if (!isRemote && prev.secondsRemaining <= 1) {
          // Timeout! Force turn progression
          if (prev.activePlayerIndex === 0) {
            // Human timed out: auto draw
            return drawCard(prev, 0);
          }
        }
        return {
          ...prev,
          secondsRemaining: Math.max(0, prev.secondsRemaining - 1),
          dailyBonusSeconds: nextBonus,
        };
      });
    }, 1000);

    return () => clearInterval(t);
  }, [gameState.gameStatus, gameState.activePlayerIndex, isRemote]);

  // AI Turn Execution
  useEffect(() => {
    if (isRemote) return; // opponent turns arrive via server snapshots
    if (gameState.gameStatus === 'game_over') return;
    if (gameState.activePlayerIndex === 0) return; // Human turn

    const activeDifficulty = getAiDifficulty(userProfile, aiDifficulty);
    const aiIdx = gameState.activePlayerIndex;
    const timer = setTimeout(() => {
      setGameState((prev) => {
        if (prev.activePlayerIndex !== aiIdx || prev.gameStatus === 'game_over') return prev;
        const move = getAiMove(prev, aiIdx, activeDifficulty);
        if (move.action === 'play') {
          return playCard(prev, aiIdx, move.cardId, move.shape);
        } else {
          return drawCard(prev, aiIdx);
        }
      });
    }, 1300);

    return () => clearTimeout(timer);
  }, [isRemote, gameState.activePlayerIndex, gameState.gameStatus, gameState.discardPile.length, aiDifficulty, userProfile]);

  // Open Game Over dialog when game finishes
  useEffect(() => {
    setActiveMatch({
      gameId: 'whot',
      gameName: 'Wọ́t Game',
      targetScreen: 'WhotGame',
      durationSecs: 120,
    });
  }, []);

  const { updateProfileData, userProfile, refreshProfile } = useAuth();

  useEffect(() => {
    if (gameState.gameStatus === 'game_over') {
      clearActiveMatch();
      recordGameStreak(updateProfileData, userProfile);
      if (isRemote) {
        onRemoteGameOver?.(gameState.winner);
        return;
      }
      setDialog('game_over');
      if (gameState.winner?.id === 0) {
        onWin?.(500);
      }
    }
  }, [gameState.gameStatus, gameState.winner, isRemote, onWin, onRemoteGameOver, updateProfileData, userProfile]);


  function layout(e) {
    const { width, height } = e.nativeEvent.layout;
    setBounds({ width, height });
  }

  // Handle Play Action
  function handlePlayCard(cardId) {
    if (gameState.activePlayerIndex !== 0) {
      setGameState((prev) => ({ ...prev, statusMessage: "Wait for your turn!" }));
      return;
    }

    const card = humanHand.find((c) => c.id === cardId);
    if (!card) return;

    if (isRemote) {
      setSelected(null);
      if (card.value === 20) {
        // Server requires a declared shape for WHOT (20).
        setPendingWhotCardId(card.id);
        setDialog('whot_picker');
        return;
      }
      sendRemoteMove({ card: engineCardToServer(card) });
      return;
    }

    if (!isValidMove(card, topDiscard, gameState.requestedShape, gameState.pendingDrawPenalty)) {
      setGameState((prev) => ({
        ...prev,
        statusMessage: `Cannot play ${card.value} ${card.shape}. Must match ${gameState.requestedShape ? gameState.requestedShape.toUpperCase() : topDiscard.shape.toUpperCase()} or ${topDiscard.value}.`,
      }));
      return;
    }

    if (card.value === 20) {
      // Open shape selection picker for WHOT card
      setPendingWhotCardId(card.id);
      setDialog('whot_picker');
      return;
    }

    pushHistory(gameState);
    setGameState((prev) => playCard(prev, 0, card.id));
    setSelected(null);
    onPlay?.(card);
  }

  const [history, setHistory] = useState([]);
  const [lastMoveTimestamp, setLastMoveTimestamp] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timerId = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timerId);
  }, []);

  const undoSecondsLeft = lastMoveTimestamp ? Math.max(0, 10 - Math.floor((now - lastMoveTimestamp) / 1000)) : 0;
  const canUndo = history.length > 0 && undoSecondsLeft > 0;

  function pushHistory(stateToSave) {
    setHistory((prev) => [...prev.slice(-10), stateToSave]);
    setLastMoveTimestamp(Date.now());
  }

  // Handle Action Buttons
  function handleAction(id) {
    if (id === 'undo') {
      if (!canUndo) {
        setGameState((prev) => ({ ...prev, statusMessage: undoSecondsLeft === 0 && lastMoveTimestamp ? "Undo time expired (10s limit)!" : "No previous move to undo!" }));
        return;
      }
      const previousState = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setGameState({ ...previousState, statusMessage: "↺ Last play undone!" });
      return;
    }

    if (id === 'hint') {
      const top = gameState.discardPile[gameState.discardPile.length - 1];
      const req = gameState.requestedShape;
      const validCards = humanHand.filter((c) => c.value === 20 || (req ? c.shape === req : (c.shape === top.shape || c.value === top.value)));
      if (validCards.length > 0) {
        const bestCard = validCards.find((c) => c.value === 20) || validCards[0];
        setGameState((prev) => ({ ...prev, statusMessage: `💡 Hint: Play ${bestCard.value} ${bestCard.shape.toUpperCase()}!` }));
        setSelected(bestCard.id);
      } else {
        setGameState((prev) => ({ ...prev, statusMessage: "💡 Hint: No matching card in hand. Tap Draw Pile to draw!" }));
      }
      return;
    }

    if (id === 'draw') {
      if (gameState.activePlayerIndex !== 0) {
        setGameState((prev) => ({ ...prev, statusMessage: "Wait for your turn to draw!" }));
        return;
      }
      if (isRemote) {
        sendRemoteMove({ pickFromMarket: true });
        return;
      }
      pushHistory(gameState);
      setGameState((prev) => drawCard(prev, 0));
      setSelected(null);
      return;
    }

    if (id === 'play') {
      if (!selected) {
        setGameState((prev) => ({ ...prev, statusMessage: "Select a card from your hand first!" }));
        return;
      }
      handlePlayCard(selected);
      return;
    }

    if (id === 'whot') {
      const whotCard = humanHand.find((c) => c.value === 20);
      if (whotCard) {
        setPendingWhotCardId(whotCard.id);
      } else {
        setPendingWhotCardId(null);
      }
      setDialog('whot_picker');
      return;
    }

    if (id === 'emoji') {
      const randomEmoji = ['😊', '🔥', '🎉', '😎', '👑', '⚡'][Math.floor(Math.random() * 6)];
      setDraft((prev) => prev + randomEmoji);
      setDialog('chat');
      return;
    }

    setDialog(id);
    onAction?.(id);
  }

  // Handle WHOT Shape Selection
  function handleSelectShape(shape) {
    setDialog(null);
    if (isRemote) {
      if (pendingWhotCardId) {
        const card = humanHand.find((c) => c.id === pendingWhotCardId);
        setPendingWhotCardId(null);
        setSelected(null);
        if (card) sendRemoteMove({ card: engineCardToServer(card), declaredShape: shape });
      }
      return;
    }
    if (pendingWhotCardId) {
      setGameState((prev) => playCard(prev, 0, pendingWhotCardId, shape));
      setPendingWhotCardId(null);
      setSelected(null);
    } else {
      setGameState((prev) => ({
        ...prev,
        requestedShape: shape,
        statusMessage: `You called ${shape.toUpperCase()}!`,
      }));
    }
  }

  // Handle Chat Message Sending
  function handleSendMessage() {
    const text = draft.trim();
    if (!text) return;

    // Real multiplayer/practice rooms are server-authoritative: send the
    // message through the backend socket, which relays it to the room.
    if (isRemote && typeof onMessage === 'function') {
      onMessage(text);
      setDraft('');
      return;
    }

    const newMsg = {
      id: String(Date.now()),
      sender: 'You',
      text,
      isUser: true,
    };

    setGameState((prev) => ({
      ...prev,
      messages: [...prev.messages, newMsg],
    }));
    setDraft('');
    onMessage?.(text);

    // Random AI bot response after 1.5s
    setTimeout(() => {
      const botNames = ['QueenBee', 'Oba', 'KingTee'];
      const randomBot = botNames[Math.floor(Math.random() * botNames.length)];
      const randomReply = AI_CHAT_RESPONSES[Math.floor(Math.random() * AI_CHAT_RESPONSES.length)];

      setGameState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { id: String(Date.now()), sender: randomBot, text: randomReply, isUser: false },
        ],
      }));
    }, 1500);
  }

  // Append incoming room chat (multiplayer) deduplicated by server message id.
  useEffect(() => {
    let changed = false;
    for (const chat of incomingChats || []) {
      const id = chat?.id;
      if (!id || knownChatIds.current.has(id)) continue;
      knownChatIds.current.add(id);
      const name = chat?.displayName || 'Opponent';
      setGameState((prev) => {
        if (prev.messages.some((m) => m.id === id)) return prev;
        return {
          ...prev,
          messages: [
            ...prev.messages,
            { id, sender: name, text: chat?.text || '', isUser: false },
          ],
        };
      });
      changed = true;
    }
  }, [incomingChats]);

  // Restart Game
  function handleRestart() {
    setGameState(createInitialState());
    setSelected(null);
    setDialog(null);
  }

  // Claim Daily Bonus
  function handleClaimBonus() {
    setGameState((prev) => ({ ...prev, dailyBonusSeconds: 86400 }));
    setDialog(null);

    if (userProfile?.id || userProfile?.uid) {
      // Real backend grant — idempotent per claim per UTC day.
      wallet
        .freeCoins('whot-bonus')
        .then((res) => {
          const amount = res?.amountKobo != null ? res.amountKobo / 100 : 500;
          if (res?.granted) {
            setGameState((prev) => ({
              ...prev,
              coinBalance: prev.coinBalance + amount,
              statusMessage: `${amount} bonus coins claimed.`,
            }));
            if (refreshProfile) refreshProfile().catch(() => {});
          } else {
            setGameState((prev) => ({
              ...prev,
              statusMessage: 'Already claimed today — come back tomorrow.',
            }));
          }
        })
        .catch(() => {
          setGameState((prev) => ({ ...prev, statusMessage: 'Could not claim the bonus.' }));
        });
      return;
    }

    // Offline / signed-out fallback: local only.
    setGameState((prev) => ({
      ...prev,
      coinBalance: prev.coinBalance + 500,
      statusMessage: '500 local bonus coins claimed.',
    }));
  }

  // Calculate Centers for User Hand Cards
  const centers = getCardCenters(humanHand.length);
  const bonusHours = String(Math.floor(gameState.dailyBonusSeconds / 3600)).padStart(2, '0');
  const bonusMins = String(Math.floor((gameState.dailyBonusSeconds % 3600) / 60)).padStart(2, '0');
  const bonusSecs = String(gameState.dailyBonusSeconds % 60).padStart(2, '0');
  const bonusText = `${bonusHours}:${bonusMins}:${bonusSecs}`;

  return (
    <View style={styles.root} onLayout={layout}>
      {scale > 0 && (
        <View style={{ width: 1024 * scale, height: 1536 * scale }}>
          {/* Main SVG Artwork */}
          <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Artwork
              width={1024 * scale}
              height={1536 * scale}
              selected={selected}
              seconds={gameState.secondsRemaining}
              bonus={bonusText}
              drawCount={gameState.drawPile.length}
              hand={humanHand}
              last={topDiscard}
              requestedShape={gameState.requestedShape}
              activePlayerIndex={gameState.activePlayerIndex}
              coinBalance={gameState.coinBalance}
              statusText={gameState.statusMessage}
              undoSecondsLeft={undoSecondsLeft}
              canUndo={canUndo}
            />
          </View>

          {/* Character Portraits */}
          {[0, 1, 2, 3].map((index) => (
            <Portrait key={index} index={index} scale={scale} />
          ))}

          {/* Status Message Banner Overlay */}
          <View style={{ position: 'absolute', top: 350 * scale, left: 150 * scale, width: 724 * scale, alignItems: 'center' }}>
            <View style={{ backgroundColor: '#000000bb', paddingHorizontal: 20 * scale, paddingVertical: 10 * scale, borderRadius: 20 * scale, borderWidth: 2 * scale, borderColor: '#7042ff' }}>
              <Text style={{ color: '#fff', fontSize: 24 * scale, fontWeight: '800', textAlign: 'center' }}>
                {gameState.statusMessage}
              </Text>
            </View>
          </View>

          {/* Opponent Card Count Badges */}
          {[
            { x: 181, y: 548, n: gameState.players[1].hand.length }, // QueenBee
            { x: 954, y: 548, n: gameState.players[3].hand.length }, // KingTee
            { x: 459, y: 329, n: gameState.players[2].hand.length }, // AI Bot
          ].map((b, idx) => (
            <View
              key={idx}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: (b.x - 21) * scale,
                top: (b.y - 21) * scale,
                width: 42 * scale,
                height: 42 * scale,
                borderRadius: 21 * scale,
                backgroundColor: '#9800ee',
                borderColor: '#d873ff',
                borderWidth: 2 * scale,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 26 * scale, fontWeight: '900' }}>{b.n}</Text>
            </View>
          ))}

          {/* Interactive Player Hand Cards */}
          {humanHand.map((card, i) => {
            const c = centers[i] || { x: 512, y: 1115, a: 0 };
            return (
              <Pressable
                key={card.id}
                accessibilityRole="button"
                accessibilityLabel={`${card.value} ${card.shape} card`}
                accessibilityState={{ selected: selected === card.id }}
                onPress={() => {
                  if (selected === card.id) {
                    // Double tap plays card
                    handlePlayCard(card.id);
                  } else {
                    setSelected(card.id);
                  }
                }}
                style={({ pressed }) => ({
                  position: 'absolute',
                  left: (c.x - 49) * scale,
                  top: (c.y - 91) * scale,
                  width: 98 * scale,
                  height: 182 * scale,
                  borderRadius: 12 * scale,
                  backgroundColor: pressed ? '#ffffff33' : 'transparent',
                })}
              />
            );
          })}

          {/* Interactive Action Buttons */}
          {BUTTONS.map((b) => (
            <Pressable
              key={b.id}
              accessibilityRole="button"
              accessibilityLabel={b.id === 'whot' ? 'Call WHOT' : b.id === 'coins' ? 'Add coins' : b.id === 'chat' ? 'Compose message' : b.id}
              onPress={() => handleAction(b.id)}
              style={({ pressed }) => ({
                position: 'absolute',
                left: b.x * scale,
                top: b.y * scale,
                width: b.w * scale,
                height: b.h * scale,
                borderRadius: 38 * scale,
                backgroundColor: pressed ? '#ffffff33' : 'transparent',
              })}
            />
          ))}

          {/* Interactive Draw Pile Touch Target */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Draw pile, ${gameState.drawPile.length} cards remaining`}
            onPress={() => handleAction('draw')}
            style={{
              position: 'absolute',
              left: 304 * scale,
              top: 632 * scale,
              width: 155 * scale,
              height: 310 * scale,
            }}
          />
        </View>
      )}

      {/* Dialog & Modal Engine */}
      <Modal visible={dialog !== null} transparent animationType="fade" onRequestClose={() => setDialog(null)}>
        <View style={styles.scrim}>
          <View style={styles.dialog} accessibilityViewIsModal>
            {dialog === 'whot_picker' ? (
              <>
                <Text style={styles.title}>🃏 Call WHOT Shape!</Text>
                <Text style={styles.body}>Select the shape you want to request for the next play:</Text>
                <View style={styles.shapeGrid}>
                  {['circle', 'triangle', 'cross', 'square', 'star'].map((shape) => (
                    <Pressable
                      key={shape}
                      style={styles.shapeCard}
                      onPress={() => handleSelectShape(shape)}
                    >
                      <Shape shape={shape} x={0} y={0} size={50} color={shape === 'cross' ? '#f9002c' : shape === 'square' ? '#00bb50' : shape === 'circle' ? '#9400df' : shape === 'triangle' ? '#ff9900' : '#ff5e00'} />
                      <Text style={styles.shapeText}>{shape.toUpperCase()}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : dialog === 'chat' ? (
              <>
                <Text style={styles.title}>💬 Local Table Chat</Text>
                <ScrollView style={{ maxHeight: 200, marginVertical: 12 }}>
                  {gameState.messages.length ? (
                    gameState.messages.map((m) => (
                      <View key={m.id} style={{ marginBottom: 8 }}>
                        <Text style={{ color: m.isUser ? '#70ddff' : '#ffd224', fontWeight: '800' }}>
                          {m.sender}: <Text style={{ color: '#efeaff', fontWeight: '400' }}>{m.text}</Text>
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.body}>No messages yet. Say hello!</Text>
                  )}
                </ScrollView>
                <TextInput
                  accessibilityLabel="Message"
                  placeholder="Type a message..."
                  placeholderTextColor="#aaa3d6"
                  value={draft}
                  onChangeText={setDraft}
                  maxLength={200}
                  style={styles.input}
                />
                <View style={styles.row}>
                  <Pressable style={styles.button} onPress={handleSendMessage}>
                    <Text style={styles.buttonText}>Send</Text>
                  </Pressable>
                </View>
              </>
            ) : dialog === 'menu' ? (
              <>
                <Text style={styles.title}>🎮 Room 458721</Text>
                <Text style={styles.body}>Classic 4-Player WHOT Mode</Text>
                <Text style={styles.body}>• You vs QueenBee, Oba, and KingTee</Text>
                <Text style={styles.body}>• Play matching shape or value to empty your hand!</Text>
                <Pressable style={[styles.button, { backgroundColor: '#7042ff', marginTop: 16 }]} onPress={handleRestart}>
                  <Text style={[styles.buttonText, { color: '#fff' }]}>🔄 Restart Game</Text>
                </Pressable>
              </>
            ) : dialog === 'settings' ? (
              <>
                <Text style={styles.title}>⚙️ Game Settings</Text>
                <View style={styles.row}>
                  <Text style={styles.body}>Sound Effects & Audio</Text>
                  <Switch
                    value={gameState.soundEnabled}
                    onValueChange={(val) => setGameState((prev) => ({ ...prev, soundEnabled: val }))}
                  />
                </View>
                <Pressable style={[styles.button, { marginTop: 16 }]} onPress={() => setDialog('rules')}>
                  <Text style={styles.buttonText}>📖 How to Play WHOT Rules</Text>
                </Pressable>
              </>
            ) : dialog === 'rules' ? (
              <>
                <Text style={styles.title}>📖 WHOT Game Rules</Text>
                <ScrollView style={{ maxHeight: 220, marginVertical: 8 }}>
                  <Text style={styles.body}>• <Text style={{ fontWeight: '800', color: '#70ddff' }}>1 (Hold On)</Text>: Play again immediately.</Text>
                  <Text style={styles.body}>• <Text style={{ fontWeight: '800', color: '#70ddff' }}>2 (Pick Two)</Text>: Next player draws 2 cards unless countered with another 2!</Text>
                  <Text style={styles.body}>• <Text style={{ fontWeight: '800', color: '#70ddff' }}>5 (Pick Three)</Text>: Next player draws 3 cards unless countered with another 5!</Text>
                  <Text style={styles.body}>• <Text style={{ fontWeight: '800', color: '#70ddff' }}>8 (Suspension)</Text>: Next player's turn is skipped.</Text>
                  <Text style={styles.body}>• <Text style={{ fontWeight: '800', color: '#70ddff' }}>14 (General Market)</Text>: All opponents draw 1 card.</Text>
                  <Text style={styles.body}>• <Text style={{ fontWeight: '800', color: '#70ddff' }}>20 (WHOT)</Text>: Wild card! Choose any shape to request.</Text>
                </ScrollView>
              </>
            ) : dialog === 'coins' ? (
              <>
                <Text style={styles.title}>💰 Coin Wallet</Text>
                <Text style={styles.body}>Current Balance: <Text style={{ fontWeight: '900', color: '#ffd224' }}>{gameState.coinBalance.toLocaleString()} Coins</Text></Text>
                <Text style={styles.body}>Win games to earn +500 coins!</Text>
                <Pressable style={[styles.button, { backgroundColor: '#00d653', marginTop: 16 }]} onPress={handleClaimBonus}>
                  <Text style={[styles.buttonText, { color: '#fff' }]}>🎁 Claim +500 Free Coins</Text>
                </Pressable>
              </>
            ) : dialog === 'bonus' ? (
              <>
                <Text style={styles.title}>🎁 Daily Bonus</Text>
                <Text style={styles.body}>Next daily reward in: <Text style={{ fontWeight: '800', color: '#70ddff' }}>{bonusText}</Text></Text>
                <Pressable style={[styles.button, { backgroundColor: '#00d653', marginTop: 16 }]} onPress={handleClaimBonus}>
                  <Text style={[styles.buttonText, { color: '#fff' }]}>Claim 500 Bonus Coins Now</Text>
                </Pressable>
              </>
            ) : dialog === 'game_over' ? (
              <>
                <Text style={styles.title}>{gameState.winner?.id === 0 ? '🏆 VICTORY!' : '💔 GAME OVER'}</Text>
                <Text style={styles.body}>
                  {gameState.winner?.id === 0
                    ? 'Congratulations! You emptied your hand first and won the match!'
                    : `${gameState.winner?.name} won the match!`}
                </Text>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                  <Pressable style={[styles.button, { backgroundColor: 'rgba(255,255,255,0.15)', flex: 1, alignItems: 'center' }]} onPress={onBack || handleRestart}>
                    <Text style={[styles.buttonText, { color: '#fff' }]}>🚪 Exit Game</Text>
                  </Pressable>
                  <Pressable style={[styles.button, { backgroundColor: '#7042ff', flex: 1, alignItems: 'center' }]} onPress={handleRestart}>
                    <Text style={[styles.buttonText, { color: '#fff' }]}>🎮 Play Again</Text>
                  </Pressable>
                </View>
              </>
            ) : null}

            <Pressable accessibilityRole="button" style={[styles.button, { marginTop: 12 }]} onPress={() => setDialog(null)}>
              <Text style={styles.buttonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10075d', overflow: 'hidden', paddingTop: 35 },
  scrim: { flex: 1, backgroundColor: '#000000aa', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 440, backgroundColor: '#181047', borderRadius: 24, padding: 24, borderWidth: 2, borderColor: '#8527e8' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 12 },
  body: { fontSize: 16, lineHeight: 24, color: '#efeaff', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
  input: { borderWidth: 1, borderColor: '#8054b8', borderRadius: 12, padding: 12, color: '#fff', fontSize: 16, marginVertical: 8 },
  button: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 12, minHeight: 44, borderRadius: 12 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#70ddff' },
  shapeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginVertical: 16 },
  shapeCard: { width: '47%', backgroundColor: '#261b6e', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#7042ff' },
  shapeText: { color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 8 },
});
