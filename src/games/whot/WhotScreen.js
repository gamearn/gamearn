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
  TouchableOpacity,
  View,
} from 'react-native';
import Svg from 'react-native-svg';
import {
  Artwork,
  BUTTONS,
  PORTRAITS,
  Shape,
  getCardCenters,
} from './Artwork';

const SHAPE_COLORS = {
  star: '#FFCC00',
  triangle: '#FF9900',
  cross: '#F9002C',
  square: '#00BB50',
  circle: '#9400DF',
};

function getShapeColor(shape) {
  if (!shape) return '#00E5FF';
  return SHAPE_COLORS[shape.toLowerCase()] || '#00E5FF';
}
import {
  AI_CHAT_RESPONSES,
  createInitialState,
  drawCard,
  getAiMove,
  playCard,
  reduceStateOnTurnTimeout,
  isValidMove,
} from './whotGameEngine';
import { setActiveMatch, clearActiveMatch, getActiveMatch, updateActiveMatchState } from '../../utils/activeMatch';
import { engineCardToServer } from './serverAdapter';
import { useAuth } from '../../context/AuthContext';
import { recordGameStreak } from '../../utils/recordGameStreak';
import { getAiDifficulty } from '../../utils/aiDifficulty';
import { wallet } from '../../services/api';
import CoinTossModal from '../../components/CoinTossModal';

export function Portrait({ index, scale, avatarUrl = null }) {
  const c = PORTRAITS[index];
  if (!c) return null;
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
        borderWidth: 2 * scale,
        borderColor: '#7042ff',
        backgroundColor: '#0a0e1a',
      }}
    >
      {avatarUrl ? (
        <Image
          source={typeof avatarUrl === 'string' ? { uri: avatarUrl } : avatarUrl}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      ) : (
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
      )}
    </View>
  );
}

export function WhotScreen({
  timer = '2m',
  cardCount = 6,
  playerCount = 2,
  vsOba = false,
  onAction,
  onPlay,
  onMessage,
  onWin,
  onBack = null,
  isRemote = false,
  remote = null,
  onRemoteMove,
  onRemoteGameOver,
  aiDifficulty = 'auto',
  incomingChats = [],
  secondsRemaining = null,
}) {
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [gameState, setGameState] = useState(() =>
    createInitialState(timer, cardCount, vsOba ? 2 : (playerCount || 2), vsOba)
  );
  const displaySeconds = (isRemote && secondsRemaining != null)
    ? secondsRemaining
    : (gameState?.secondsRemaining ?? parseTimerSec(timer));
  const [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [showCoinToss, setShowCoinToss] = useState(true);
  const [pendingWhotCardId, setPendingWhotCardId] = useState(null);
  const [draft, setDraft] = useState('');
  const knownChatIds = useRef(new Set());

  const isSubmittingMoveRef = useRef(false);

  // Remote (server-authoritative) mode: every turn/law/effect comes from the
  // backend. Rehydrate the local render tree wholesale on each new snapshot;
  // human moves are sent to the server, never applied locally.
  useEffect(() => {
    if (!isRemote || !remote) return;
    setGameState(remote);
    isSubmittingMoveRef.current = false;
  }, [remote, isRemote]);

  function sendRemoteMove(move) {
    setGameState((prev) => ({ ...prev, statusMessage: 'Sending move…' }));
    onRemoteMove?.(move);
  }

  const activePlayer = gameState?.players?.[gameState?.activePlayerIndex] || gameState?.players?.[0];
  const humanHand = gameState?.players?.[0]?.hand || [];
  const topDiscard = gameState?.discardPile && gameState.discardPile.length > 0
    ? gameState.discardPile[gameState.discardPile.length - 1]
    : null;

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
          // Timeout! Forfeit turn & auto draw card
          const drawn = drawCard(prev, prev.activePlayerIndex);
          const pName = prev.players[prev.activePlayerIndex]?.name || 'Player';
          return {
            ...drawn,
            statusMessage: `⏱️ Time's up! ${pName} lost turn and drew a card.`,
            secondsRemaining: prev.turnTimerSeconds || 120,
            dailyBonusSeconds: nextBonus,
          };
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
          if (move.shape) {
            const botName = prev.players[aiIdx]?.name || (aiIdx === 1 ? 'Oba 👑' : `Player ${aiIdx}`);
            showShapeCallPopup(move.shape, botName);
          }
          return playCard(prev, aiIdx, move.cardId, move.shape);
        } else {
          return drawCard(prev, aiIdx);
        }
      });
    }, 1300);

    return () => clearTimeout(timer);
  }, [isRemote, gameState?.activePlayerIndex, gameState?.gameStatus, gameState?.discardPile?.length, aiDifficulty]);

  const { updateProfileData, userProfile, refreshProfile } = useAuth();
  const mountStreakRecorded = useRef(false);
  const gameOverHandled = useRef(false);

  const [showFormationModal, setShowFormationModal] = useState(true);
  const [formationCountdown, setFormationCountdown] = useState(7);

  // 3-Second Pop-Up for WHOT (20) Requested Shape
  const [shapeCallPopup, setShapeCallPopup] = useState(null);
  const popupTimeoutRef = useRef(null);
  const lastRequestedShapeRef = useRef(null);
  const lastDiscardLenRef = useRef(0);
  const lastHumanPlayedWhotRef = useRef(false);

  function showShapeCallPopup(shape, caller, isYou = false) {
    if (!shape) return;
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    setShapeCallPopup({ shape, caller, isYou, key: Date.now() });
    popupTimeoutRef.current = setTimeout(() => {
      setShapeCallPopup(null);
    }, 3000);
  }

  // Monitor requestedShape updates across both local and remote matches
  useEffect(() => {
    const currentShape = gameState?.requestedShape;
    const discardLen = gameState?.discardPile?.length || 0;

    if (currentShape && (currentShape !== lastRequestedShapeRef.current || discardLen !== lastDiscardLenRef.current)) {
      let isYou = false;
      let caller = 'Opponent';

      if (lastHumanPlayedWhotRef.current) {
        isYou = true;
        caller = 'You';
      } else if (gameState?.pendingShapeCallerName) {
        caller = gameState.pendingShapeCallerName;
        isYou = gameState.pendingShapeCallerUid === remote?.selfUid;
      } else if (gameState?.pendingShapeCallerUid) {
        isYou = gameState.pendingShapeCallerUid === remote?.selfUid;
        caller = isYou ? 'You' : (vsOba ? 'Oba 👑' : (gameState?.players?.[1]?.name || 'Oba 👑'));
      } else if (gameState?.statusMessage?.includes('Oba')) {
        caller = 'Oba 👑';
        isYou = false;
      } else if (gameState?.statusMessage?.includes('QueenBee')) {
        caller = 'QueenBee';
        isYou = false;
      } else if (gameState?.statusMessage?.includes('KingTee')) {
        caller = 'KingTee';
        isYou = false;
      } else {
        // In vs Oba mode or 2-player game, opponent who played WHOT is Oba!
        caller = vsOba ? 'Oba 👑' : (gameState?.players?.[1]?.name || 'Oba 👑');
        isYou = false;
      }

      showShapeCallPopup(currentShape, caller, isYou);
    }
    lastRequestedShapeRef.current = currentShape;
    lastDiscardLenRef.current = discardLen;
  }, [gameState?.requestedShape, gameState?.discardPile?.length, gameState?.pendingShapeCallerName, gameState?.pendingShapeCallerUid]);

  useEffect(() => {
    return () => {
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    };
  }, []);

  // Pre-game 7 seconds Countdown Modal Effect
  useEffect(() => {
    if (!showFormationModal) return;
    const interval = setInterval(() => {
      setFormationCountdown((prev) => {
        if (prev <= 1) {
          setShowFormationModal(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showFormationModal]);

  // Sync human player name with userProfile
  useEffect(() => {
    if (!userProfile) return;
    const displayName = userProfile?.username || userProfile?.displayName || 'You';
    setGameState((prev) => {
      if (!prev?.players?.[0]) return prev;
      if (prev.players[0].name === displayName) return prev;
      const copy = [...prev.players];
      copy[0] = { ...copy[0], name: displayName };
      return { ...prev, players: copy };
    });
  }, [userProfile]);

  useEffect(() => {
    let alive = true;
    if (!isRemote) {
      getActiveMatch().then((match) => {
        if (
          alive &&
          match?.gameId === 'whot' &&
          match?.savedState &&
          match.savedState.gameStatus !== 'game_over' &&
          match.savedState.players?.[0]?.hand?.length === cardCount
        ) {
          setGameState(match.savedState);
        } else {
          setActiveMatch({
            gameId: 'whot',
            gameName: 'Wọ́t Game',
            targetScreen: 'WhotGame',
            durationSecs: 120,
          });
        }
      });
    }

    if (!mountStreakRecorded.current) {
      mountStreakRecorded.current = true;
      recordGameStreak(updateProfileData, userProfile);
    }
    return () => { alive = false; };
  }, []);

  // Ensure gameState always matches the exact requested cardCount
  useEffect(() => {
    if (isRemote) return;
    setGameState((prev) => {
      if (prev?.players?.[0]?.hand?.length === cardCount) return prev;
      return createInitialState(timer, cardCount, vsOba ? 2 : (playerCount || 2), vsOba);
    });
  }, [cardCount, timer, vsOba, playerCount, isRemote]);

  useEffect(() => {
    if (gameState.gameStatus === 'game_over') {
      clearActiveMatch();
      if (!gameOverHandled.current) {
        gameOverHandled.current = true;
        recordGameStreak(updateProfileData, userProfile);
        if (isRemote) {
          onRemoteGameOver?.(gameState.winner);
          return;
        }
        if (onWin) {
          onWin(gameState.winner?.id === 0);
        } else {
          setDialog('game_over');
        }
      }
    } else if (gameState) {
      updateActiveMatchState('whot', gameState);
    }
  }, [gameState, isRemote]);

  function layout(e) {
    const { width, height } = e.nativeEvent.layout;
    setBounds({ width, height });
  }

  // Handle 1-Tap Play & Select
  function handleCardPress(card) {
    if (!card) return;
    if (gameState.activePlayerIndex !== 0) {
      setGameState((prev) => ({ ...prev, statusMessage: "Wait for your turn!" }));
      return;
    }
    if (isSubmittingMoveRef.current) return;

    const isWhot = Number(card.value) === 20 || card.shape === 'whot';
    if (isWhot) {
      setSelected(card.id);
      setPendingWhotCardId(card.id);
      setDialog('whot_picker');
      return;
    }

    const matchesShape = gameState.requestedShape
      ? card.shape === gameState.requestedShape
      : (!topDiscard || card.shape === topDiscard.shape);
    const matchesValue = topDiscard ? card.value === topDiscard.value : true;
    const canPlay = matchesShape || matchesValue;

    if (canPlay) {
      // 1-Tap plays the card immediately!
      handlePlayCard(card.id);
    } else {
      setSelected(card.id);
      setGameState((prev) => ({
        ...prev,
        statusMessage: `Cannot play ${card.value} ${card.shape}. Must match ${gameState.requestedShape ? gameState.requestedShape.toUpperCase() : (topDiscard ? topDiscard.shape.toUpperCase() : '')} or ${topDiscard ? topDiscard.value : ''}.`,
      }));
    }
  }

  // Handle Play Action
  function handlePlayCard(cardId) {
    if (gameState.activePlayerIndex !== 0) {
      setGameState((prev) => ({ ...prev, statusMessage: "Wait for your turn!" }));
      return;
    }
    if (isSubmittingMoveRef.current) return;

    const card = humanHand.find((c) => c.id === cardId);
    if (!card) return;

    const isWhot = Number(card.value) === 20 || card.shape === 'whot';

    if (isRemote) {
      setSelected(null);
      if (isWhot) {
        setPendingWhotCardId(card.id);
        setDialog('whot_picker');
        return;
      }
      isSubmittingMoveRef.current = true;
      setTimeout(() => { isSubmittingMoveRef.current = false; }, 1500);
      sendRemoteMove({ card: engineCardToServer(card) });
      return;
    }

    if (!isWhot && !isValidMove(card, topDiscard, gameState.requestedShape, gameState.pendingDrawPenalty)) {
      setGameState((prev) => ({
        ...prev,
        statusMessage: `Cannot play ${card.value} ${card.shape}. Must match ${gameState.requestedShape ? gameState.requestedShape.toUpperCase() : topDiscard.shape.toUpperCase()} or ${topDiscard.value}.`,
      }));
      return;
    }

    if (isWhot) {
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
      if (gameState.activePlayerIndex !== 0) {
        setGameState((prev) => ({ ...prev, statusMessage: "Wait for your turn to call WHOT!" }));
        return;
      }
      const whotCard = humanHand.find((c) => Number(c?.value) === 20 || c?.shape === 'whot');
      if (!whotCard) {
        setGameState((prev) => ({
          ...prev,
          statusMessage: "You don't have a WHOT (20) card in your hand!",
        }));
        return;
      }
      setPendingWhotCardId(whotCard.id);
      setSelected(whotCard.id);
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
    const whotCard = (pendingWhotCardId && humanHand.find((c) => c.id === pendingWhotCardId))
      || humanHand.find((c) => Number(c?.value) === 20 || c?.shape === 'whot');

    if (!whotCard) {
      setPendingWhotCardId(null);
      setSelected(null);
      setGameState((prev) => ({
        ...prev,
        statusMessage: "You don't have a WHOT (20) card in your hand!",
      }));
      return;
    }

    lastHumanPlayedWhotRef.current = true;
    setTimeout(() => {
      lastHumanPlayedWhotRef.current = false;
    }, 3000);

    showShapeCallPopup(shape, 'You', true);

    if (isRemote) {
      setPendingWhotCardId(null);
      setSelected(null);
      isSubmittingMoveRef.current = true;
      setTimeout(() => { isSubmittingMoveRef.current = false; }, 1500);
      sendRemoteMove({ card: engineCardToServer(whotCard), declaredShape: shape });
      return;
    }

    pushHistory(gameState);
    setGameState((prev) => playCard(prev, 0, whotCard.id, shape));
    setPendingWhotCardId(null);
    setSelected(null);
    onPlay?.(whotCard);
  }

  // Handle Chat Message Sending
  function handleSendMessage() {
    const text = draft.trim();
    if (!text) return;

    if (isRemote && typeof onMessage === 'function') {
      onMessage(text);
      setDraft('');
      return;
    }

    const newMsg = {
      id: String(Date.now()),
      sender: userProfile?.username || userProfile?.displayName || 'You',
      text,
      isUser: true,
    };

    setGameState((prev) => ({
      ...prev,
      messages: [...prev.messages, newMsg],
    }));
    setDraft('');
    onMessage?.(text);

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
    setGameState(createInitialState(timer, cardCount, vsOba ? 2 : (playerCount || 2), vsOba));
    setSelected(null);
    setDialog(null);
    setFormationCountdown(7);
    setShowFormationModal(true);
  }

  // Claim Daily Bonus
  function handleClaimBonus() {
    setGameState((prev) => ({ ...prev, dailyBonusSeconds: 86400 }));
    setDialog(null);

    if (userProfile?.id || userProfile?.uid) {
      wallet
        .freeValuePoints('whot-bonus')
        .then((res) => {
          const amount = res?.valuePoints ?? 2;
          if (res?.granted) {
            setGameState((prev) => ({
              ...prev,
              statusMessage: `${amount} bonus Value Points claimed.`,
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

    setGameState((prev) => ({
      ...prev,
      statusMessage: 'Bonus Value Points can only be claimed when signed in.',
    }));
  }

  const selectedIndex = humanHand.findIndex((c) => c.id === selected);
  const centers = getCardCenters(humanHand.length, selectedIndex);
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
              seconds={displaySeconds}
              bonus={bonusText}
              drawCount={gameState?.drawPile?.length || 0}
              hand={humanHand}
              last={topDiscard}
              requestedShape={gameState?.requestedShape}
              activePlayerIndex={gameState?.activePlayerIndex ?? 0}
              valuePoints={userProfile?.valuePoints ?? 0}
              statusText={gameState?.statusMessage}
              undoSecondsLeft={undoSecondsLeft}
              canUndo={canUndo}
              players={gameState?.players || []}
              userProfile={userProfile}
            />
          </View>

          {/* Character Portraits dynamically filtered by total players */}
          {((gameState?.players?.length || 2) === 2
            ? [
                { portraitIndex: 2, player: gameState.players[1] },
                { portraitIndex: 3, player: gameState.players[0] },
              ]
            : gameState.players.length === 3
            ? [
                { portraitIndex: 0, player: gameState.players[1] },
                { portraitIndex: 2, player: gameState.players[2] },
                { portraitIndex: 3, player: gameState.players[0] },
              ]
            : [
                { portraitIndex: 0, player: gameState.players[1] },
                { portraitIndex: 1, player: gameState.players[3] },
                { portraitIndex: 2, player: gameState.players[2] },
                { portraitIndex: 3, player: gameState.players[0] },
              ]
          ).map(({ portraitIndex, player }) => (
            <Portrait
              key={portraitIndex}
              index={portraitIndex}
              scale={scale}
              avatarUrl={player?.id === 0 ? (userProfile?.avatar || userProfile?.photoURL || player?.avatar) : player?.avatar}
            />
          ))}

          {/* Crown on Bot / Oba Profile Image */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: (PORTRAITS[2].x + PORTRAITS[2].w / 2 - 20) * scale,
              top: (PORTRAITS[2].y - 24) * scale,
              zIndex: 99,
            }}
          >
            <Text style={{ fontSize: 32 * scale }}>👑</Text>
          </View>

          {/* Status Message Banner Overlay */}
          <View style={{ position: 'absolute', top: 350 * scale, left: 150 * scale, width: 724 * scale, alignItems: 'center' }}>
            <View style={{ backgroundColor: '#000000bb', paddingHorizontal: 20 * scale, paddingVertical: 10 * scale, borderRadius: 20 * scale, borderWidth: 2 * scale, borderColor: '#7042ff' }}>
              <Text style={{ color: '#fff', fontSize: 24 * scale, fontWeight: '800', textAlign: 'center' }}>
                {gameState.statusMessage}
              </Text>
            </View>
          </View>

          {/* Opponent Card Count Badges */}
          {((gameState?.players?.length || 2) === 2
            ? [{ x: 512, y: 345, n: gameState.players[1]?.hand?.length || 0, name: gameState.players[1]?.name }]
            : gameState.players.length === 3
            ? [
                { x: 181, y: 548, n: gameState.players[1]?.hand?.length || 0, name: gameState.players[1]?.name },
                { x: 512, y: 345, n: gameState.players[2]?.hand?.length || 0, name: gameState.players[2]?.name },
              ]
            : [
                { x: 181, y: 548, n: gameState.players[1]?.hand?.length || 0, name: gameState.players[1]?.name },
                { x: 843, y: 548, n: gameState.players[3]?.hand?.length || 0, name: gameState.players[3]?.name },
                { x: 512, y: 345, n: gameState.players[2]?.hand?.length || 0, name: gameState.players[2]?.name },
              ]
          ).map((b, idx) => (
            <View
              key={idx}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: (b.x - 55) * scale,
                top: (b.y - 18) * scale,
                paddingHorizontal: 12 * scale,
                paddingVertical: 5 * scale,
                borderRadius: 14 * scale,
                backgroundColor: '#10B981',
                borderColor: '#34D399',
                borderWidth: 2 * scale,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.6,
                elevation: 6,
                zIndex: 50,
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 16 * scale, fontWeight: '900' }}>
                🂠 {b.n} {b.n === 1 ? 'Card' : 'Cards'}
              </Text>
            </View>
          ))}

          {/* Scrollable Expanded Hand Bar when Cards >= 5 */}
          {humanHand.length >= 5 && (
            <View
              style={{
                position: 'absolute',
                top: 975 * scale,
                left: 60 * scale,
                width: 904 * scale,
                backgroundColor: '#0a0d26f0',
                borderRadius: 18 * scale,
                borderWidth: 2 * scale,
                borderColor: '#7042ff',
                paddingVertical: 8 * scale,
                paddingHorizontal: 12 * scale,
                zIndex: 100,
              }}
            >
              <Text style={{ color: '#00E5FF', fontSize: 13 * scale, fontWeight: '900', textAlign: 'center', marginBottom: 6 * scale }}>
                🔍 MY HAND CARDS ({humanHand.length} Total — Tap to Play)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 * scale, alignItems: 'center' }}>
                {humanHand.map((card) => {
                  const isSel = selected === card.id;
                  const shapeColor = card.shape === 'whot' ? '#F59E0B' : card.shape === 'star' ? '#FF5E00' : card.color;
                  return (
                    <TouchableOpacity
                      key={card.id}
                      activeOpacity={0.8}
                      onPress={() => handleCardPress(card)}
                      style={{
                        backgroundColor: isSel ? '#7042ff' : '#161b40',
                        borderColor: isSel ? '#00E5FF' : shapeColor,
                        borderWidth: 2 * scale,
                        borderRadius: 12 * scale,
                        paddingHorizontal: 14 * scale,
                        paddingVertical: 8 * scale,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 6 * scale,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 16 * scale, fontWeight: '900' }}>
                        {card.value === 20 ? 'WHOT' : card.value}
                      </Text>
                      <Text style={{ color: shapeColor, fontSize: 14 * scale, fontWeight: '900' }}>
                        {card.shape.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Interactive Player Hand Cards */}
          {humanHand.map((card, i) => {
            const c = centers[i] || { x: 512, y: 1115, a: 0, scale: 1 };
            const isSel = selected === card.id;
            const cardW = 98 * (c.scale || 1) * scale;
            const cardH = 182 * (c.scale || 1) * scale;
            return (
              <Pressable
                key={card.id}
                accessibilityRole="button"
                accessibilityLabel={`${card.value} ${card.shape} card`}
                accessibilityState={{ selected: isSel }}
                onPress={() => handleCardPress(card)}
                style={({ pressed }) => ({
                  position: 'absolute',
                  left: (c.x - (49 * (c.scale || 1))) * scale,
                  top: (c.y - (91 * (c.scale || 1))) * scale,
                  width: cardW,
                  height: cardH,
                  borderRadius: 12 * scale,
                  backgroundColor: pressed ? '#ffffff33' : 'transparent',
                  zIndex: isSel ? 999 : i + 10,
                })}
              />
            );
          })}

          {/* Interactive Action Buttons */}
          {BUTTONS.map((b) => (
            <Pressable
              key={b.id}
              accessibilityRole="button"
              accessibilityLabel={b.id === 'whot' ? 'Call WHOT' : b.id === 'valuePoints' ? 'Add Value Points' : b.id === 'chat' ? 'Compose message' : b.id}
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
            ) : dialog === 'valuePoints' ? (
              <>
                <Text style={styles.title}>💰 Value Points</Text>
                <Text style={styles.body}>Current Balance: <Text style={{ fontWeight: '900', color: '#ffd224' }}>{(userProfile?.valuePoints ?? 0).toLocaleString()} Value Points</Text></Text>
                <Text style={styles.body}>Win games to earn Value Points!</Text>
                <Pressable style={[styles.button, { backgroundColor: '#00d653', marginTop: 16 }]} onPress={handleClaimBonus}>
                  <Text style={[styles.buttonText, { color: '#fff' }]}>🎁 Claim +2 Free Value Points</Text>
                </Pressable>
              </>
            ) : dialog === 'bonus' ? (
              <>
                <Text style={styles.title}>🎁 Daily Bonus</Text>
                <Text style={styles.body}>Next daily reward in: <Text style={{ fontWeight: '800', color: '#70ddff' }}>{bonusText}</Text></Text>
                <Pressable style={[styles.button, { backgroundColor: '#00d653', marginTop: 16 }]} onPress={handleClaimBonus}>
                  <Text style={[styles.buttonText, { color: '#fff' }]}>Claim 2 Bonus Value Points Now</Text>
                </Pressable>
              </>
            ) : null}

            <Pressable accessibilityRole="button" style={[styles.button, { marginTop: 12 }]} onPress={() => setDialog(null)}>
              <Text style={styles.buttonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Pre-Game Backend Coin Toss Modal */}
      <CoinTossModal
        visible={showCoinToss}
        players={gameState.players}
        gameName="Wọńt Game"
        onComplete={(winnerIdx) => {
          setShowCoinToss(false);
          setGameState((prev) => ({ ...prev, activePlayerIndex: winnerIdx }));
        }}
      />

      {/* 3-Second Pop-Up Overlay for Requested Shape (WHOT 20) */}
      {shapeCallPopup && (
        <Pressable
          onPress={() => setShapeCallPopup(null)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            backgroundColor: 'rgba(5, 7, 24, 0.72)',
          }}
        >
          <View
            style={{
              width: Math.min((bounds.width || 380) * 0.88, 380),
              backgroundColor: '#140c33',
              borderRadius: 24,
              borderWidth: 3,
              borderColor: getShapeColor(shapeCallPopup.shape),
              paddingVertical: 26,
              paddingHorizontal: 20,
              alignItems: 'center',
              shadowColor: getShapeColor(shapeCallPopup.shape),
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.9,
              shadowRadius: 24,
              elevation: 30,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderRadius: 20,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 18 }}>🃏</Text>
              <Text style={{ color: '#FFD700', fontSize: 15, fontWeight: '900', letterSpacing: 1.5 }}>
                WHOT 20 CALLED!
              </Text>
            </View>

            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 14 }}>
              {shapeCallPopup.isYou || shapeCallPopup.caller === 'You'
                ? 'You played 20 WHOT and requested:'
                : `${shapeCallPopup.caller} played 20 WHOT and requested:`}
            </Text>

            <View
              style={{
                width: 105,
                height: 105,
                borderRadius: 55,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderWidth: 3,
                borderColor: getShapeColor(shapeCallPopup.shape),
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <Svg width={70} height={70} viewBox="-35 -35 70 70">
                <Shape
                  shape={shapeCallPopup.shape}
                  x={0}
                  y={0}
                  size={65}
                  color={getShapeColor(shapeCallPopup.shape)}
                />
              </Svg>
            </View>

            <Text
              style={{
                color: getShapeColor(shapeCallPopup.shape),
                fontSize: 34,
                fontWeight: '900',
                letterSpacing: 3,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              {shapeCallPopup.shape}
            </Text>

            <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 14 }}>
              All players must match this shape or play WHOT (20)
            </Text>

            <View
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                paddingHorizontal: 14,
                paddingVertical: 5,
                borderRadius: 14,
              }}
            >
              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>
                ⏱️ Disappears in 3 seconds
              </Text>
            </View>
          </View>
        </Pressable>
      )}
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
