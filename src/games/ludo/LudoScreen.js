import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  Image,
  Platform,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, RotateCw, Clock, HelpCircle, X, Award, ShieldCheck } from 'lucide-react-native';
import Board from './Board';
import DiceRoll from './DiceRoll';
import { diceOptions, legalPieceIdsForValue, diceValueForMove, NAME_BY_INDEX, COLOR_BY_INDEX } from './serverAdapter';

const STATUS_TEXT = {
  connecting: 'Connecting…',
  playing: 'Live match',
  completed: 'Match over',
  aborted: 'Match cancelled',
  error: 'Connection error',
};

function sameCell(a, b) {
  return !!a && !!b && Math.abs(a.r - b.r) < 0.3 && Math.abs(a.c - b.c) < 0.3;
}

function turnLabel(viewModel, status, selectedValue, lastBotAnnouncement = '') {
  if (!viewModel) return { text: 'Loading…', tone: 'muted' };
  if (status === 'completed' || viewModel.status === 'completed') {
    const isMe = viewModel.winner === viewModel.myUid;
    const winnerPlayer = viewModel.players?.find((p) => p.uid === viewModel.winner);
    return {
      text: isMe ? '🏆 Victory! You got all pieces home!' : `🏆 Match over! ${winnerPlayer?.name || 'Winner'} won!`,
      tone: isMe ? 'you' : 'them',
    };
  }
  if (status === 'error') return { text: 'Connection problem', tone: 'error' };

  if (viewModel.isMyTurn) {
    if (viewModel.mustPass) {
      return { text: '⚠️ No legal moves! Turn passes to opponent…', tone: 'muted' };
    }
    if (!viewModel.diceRolled) {
      if (lastBotAnnouncement) {
        return { text: `${lastBotAnnouncement} • Your turn: Roll both dice!`, tone: 'you' };
      }
      return { text: '🎲 Your turn — roll both dice!', tone: 'you' };
    }
    const rolledSix = Array.isArray(viewModel.dice) && viewModel.dice.includes(6);
    if (selectedValue == null) {
      return {
        text: rolledSix ? '🎉 Rolled a 6! Choose dice number (Bonus turn!)' : '🎯 Choose a dice number',
        tone: 'you',
      };
    }
    return {
      text: rolledSix
        ? '✨ Rolled a 6! Tap piece to move (Bonus roll after!)'
        : '✨ Tap a highlighted piece to move',
      tone: 'you',
    };
  }

  const current = viewModel.players?.[viewModel.currentPlayerIndex];
  const name = current?.name || 'Oba 👑';
  if (viewModel.mustPass) {
    return { text: `⚠️ ${name} rolled ${viewModel.dice?.join(' & ') || ''} — no legal moves!`, tone: 'them' };
  }
  if (viewModel.diceRolled && Array.isArray(viewModel.dice) && viewModel.dice.length) {
    return {
      text: `🎲 ${name} rolled ${viewModel.dice.join(' & ')} — moving piece!`,
      tone: 'them',
    };
  }
  return { text: `⏳ ${name} is rolling the dice…`, tone: 'them' };
}

export default function LudoScreen({
  viewModel,
  isRemote = true,
  userProfile = null,
  status = 'playing',
  secondsRemaining = null,
  error = '',
  canMove = false,
  pending = false,
  paused = false,
  onRoll,
  onMove,
  onBack,
}) {
  const { width, height } = useWindowDimensions();

  const isFourPlayer = (viewModel?.players || []).length === 4;

  // Responsive board sizing: fits comfortably on small & large mobile screens without clipping controls
  const boardSize = Math.max(
    230,
    Math.floor(
      Math.min(
        width - 32,
        (height - (isFourPlayer ? 370 : 310)) * 0.72,
        isFourPlayer ? 290 : 320,
      ),
    ),
  );

  const [notice, setNotice] = useState('');
  const noticeTimer = useRef(null);

  const showNotice = (msg) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice(msg);
    noticeTimer.current = setTimeout(() => {
      setNotice('');
    }, 2000);
  };

  const [showRules, setShowRules] = useState(false);
  const [lastBotAnnouncement, setLastBotAnnouncement] = useState('');
  const [rolling, setRolling] = useState(false);
  const [lastDice, setLastDice] = useState([]);
  const [selectedValue, setSelectedValue] = useState(null);
  const [pickerGroup, setPickerGroup] = useState(null);
  const sawPending = useRef(false);

  useEffect(() => {
    if (Array.isArray(viewModel?.dice) && viewModel.dice.length) setLastDice(viewModel.dice);
  }, [viewModel?.dice]);

  // Selectable dice options (two dice expose each die plus the sum).
  const options = useMemo(() => diceOptions(viewModel), [viewModel]);
  const uniqueValues = useMemo(() => [...new Set(options.map((o) => o.value))], [options]);

  // Auto-pick when only one value is usable; otherwise wait for a tap.
  const diceSig = (viewModel?.dice || []).join('-');
  useEffect(() => {
    if (!viewModel?.diceRolled || !options.length) {
      setSelectedValue(null);
      setPickerGroup(null);
      return;
    }
    const movable = uniqueValues.filter((v) => legalPieceIdsForValue(viewModel, v).length > 0);
    setSelectedValue(movable.length === 1 ? movable[0] : (uniqueValues.length === 1 ? uniqueValues[0] : null));
  }, [diceSig, viewModel?.diceRolled, viewModel?.currentPlayerIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // When opponent/Oba rolls, announce and trigger animated dice tumbling
  const lastBotRollSig = !viewModel?.isMyTurn && viewModel?.diceRolled
    ? `${viewModel?.currentPlayerIndex}-${(viewModel?.dice || []).join(',')}`
    : null;

  useEffect(() => {
    if (!lastBotRollSig) return;
    setRolling(true);
    const opp = viewModel?.players?.[viewModel?.currentPlayerIndex]?.name || 'Oba 👑';
    const numbers = (viewModel?.dice || []).join(' & ');
    if (numbers) {
      const msg = `🎲 ${opp} rolled ${numbers}`;
      setLastBotAnnouncement(msg);
      showNotice(msg);
    }
    const timer = setTimeout(() => {
      setRolling(false);
    }, 750);
    return () => clearTimeout(timer);
  }, [lastBotRollSig, viewModel?.players, viewModel?.currentPlayerIndex, viewModel?.dice]);

  const legalIds = useMemo(() => {
    if (selectedValue != null) return legalPieceIdsForValue(viewModel, selectedValue);
    return viewModel?.legalPieceIds || [];
  }, [viewModel, selectedValue]);

  const canRoll = !!(
    !paused &&
    isRemote &&
    viewModel &&
    viewModel.status === 'playing' &&
    viewModel.isMyTurn &&
    !viewModel.diceRolled &&
    canMove &&
    !pending
  );

  const handleRoll = () => {
    if (!canRoll) return;
    sawPending.current = false;
    setRolling(true);
    onRoll && onRoll();
  };

  const handlePick = (pieceId) => {
    if (paused) return;
    if (!viewModel?.diceRolled) {
      showNotice('Please roll the dice first');
      return;
    }
    const current = viewModel?.players?.[viewModel.currentPlayerIndex];
    const target = current?.pieces?.find((p) => p.pieceId === pieceId);
    if (!target) return;
    const group = (current?.pieces || []).filter(
      (p) => legalIds.includes(p.pieceId) && sameCell(p.cell, target.cell),
    );
    if (group.length > 1) {
      setPickerGroup(group);
      return;
    }
    const val = selectedValue ?? (typeof diceValueForMove === 'function' ? diceValueForMove(viewModel, pieceId) : null);
    if (val == null) {
      showNotice('Please select a dice number first');
      return;
    }
    if (!legalIds.includes(pieceId)) {
      showNotice('This piece cannot move with this roll');
      return;
    }
    onMove && onMove(pieceId, val);
  };

  // Stop tumbling once the server request settles.
  useEffect(() => {
    if (!rolling) return;
    if (pending) {
      sawPending.current = true;
      return;
    }
    if (!sawPending.current) {
      const t = setTimeout(() => setRolling(false), 250);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setRolling(false), 180);
    return () => clearTimeout(t);
  }, [rolling, pending]);

  useEffect(() => {
    if (!rolling) return;
    const t = setTimeout(() => setRolling(false), 9000);
    return () => clearTimeout(t);
  }, [rolling]);

  const diceCount = viewModel?.diceCount === 1 ? 1 : 2;
  const rawDice = rolling ? [] : viewModel?.dice?.length ? viewModel.dice : (lastDice.length ? lastDice : [5, 2]);
  const displayDice = diceCount === 2 && rawDice.length === 1
    ? [rawDice[0], rawDice[0] === 6 ? 6 : Math.min(6, rawDice[0] + 1)]
    : rawDice;
  const label = turnLabel(viewModel, status, selectedValue, lastBotAnnouncement);

  let buttonLabel = 'ROLL DICE';
  if (!viewModel?.isMyTurn) {
    const oppName = viewModel?.players?.[viewModel?.currentPlayerIndex]?.name || 'OBA';
    buttonLabel = viewModel?.diceRolled ? `${oppName.toUpperCase()} IS PLAYING…` : `${oppName.toUpperCase()} IS ROLLING…`;
  } else if (viewModel?.diceRolled) {
    buttonLabel = selectedValue == null ? 'CHOOSE A NUMBER' : 'SELECT A PIECE';
  }

  const showChips = isRemote && viewModel?.isMyTurn && viewModel?.diceRolled && options.length > 0;

  // Active player and house color index for dice emergence
  const activePlayer = viewModel?.players?.[viewModel?.currentPlayerIndex];
  const activeColorIdx = activePlayer?.pieces?.[0]?.colorIdx ?? activePlayer?.index ?? 0;

  const humanName = userProfile?.username || userProfile?.displayName || 'You';
  const humanAvatar = userProfile?.avatar || userProfile?.photoURL || null;

  const renderPlayerCard = (p) => {
    if (!p) return null;
    const isHuman = p.uid === viewModel?.myUid || p.index === 0;
    const isTurn = p.index === viewModel?.currentPlayerIndex;
    const colorIdx = p.pieces?.[0]?.colorIdx ?? p.index;
    const pieceColor = COLOR_BY_INDEX[colorIdx] || p.color || '#00E5FF';
    const displayName = isHuman ? humanName : (p.name || `Oba ${p.index} 👑`);
    const avatarUrl = isHuman ? humanAvatar : null;

    return (
      <View
        key={p.index}
        style={[
          styles.playerCard,
          isTurn && styles.playerCardActive,
          { borderColor: isTurn ? '#00E5FF' : 'rgba(255, 255, 255, 0.12)' },
        ]}
      >
        <View style={styles.avatarWrapper}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: pieceColor }]}>
              <Text style={styles.avatarInitial}>
                {isHuman ? displayName.slice(0, 1).toUpperCase() : '👑'}
              </Text>
            </View>
          )}
          {isTurn && <View style={styles.turnPulseIndicator} />}
        </View>

        <View style={styles.playerInfo}>
          <View style={styles.playerNameRow}>
            <Text
              style={[styles.playerUsername, isTurn && styles.playerUsernameActive]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            {!isHuman && <Text style={{ fontSize: 13, marginLeft: 2 }}>👑</Text>}
          </View>
          <View style={styles.playerBadgeRow}>
            <View style={[styles.colorDot, { backgroundColor: pieceColor }]} />
            <Text style={styles.colorName}>
              {NAME_BY_INDEX[colorIdx] || 'House'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const topPlayers = isFourPlayer
    ? [viewModel.players[0], viewModel.players[3]].filter(Boolean)
    : (viewModel?.players || []);
  const bottomPlayers = isFourPlayer
    ? [viewModel.players[1], viewModel.players[2]].filter(Boolean)
    : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        {/* Floating 2-second alert notification toast */}
        {!!notice && (
          <View style={styles.noticeToast} pointerEvents="none">
            <View style={styles.noticeToastInner}>
              <Text style={styles.noticeToastText}>{notice}</Text>
            </View>
          </View>
        )}

        {/* Top Navigation Bar with Back Button */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={onBack}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Ludo Game</Text>
            <Text style={styles.statusSubtitle}>
              {status === 'playing' ? (viewModel?.isMyTurn ? '• Your Turn' : '• Playing') : STATUS_TEXT[status] || status}
            </Text>
          </View>

          <View style={styles.topRightActions}>
            <TouchableOpacity
              style={styles.helpBtn}
              activeOpacity={0.7}
              onPress={() => setShowRules(true)}
              accessibilityLabel="Rules and How to Play"
              accessibilityRole="button"
            >
              <HelpCircle size={18} color="#00E5FF" />
            </TouchableOpacity>

            {secondsRemaining != null ? (
              <View style={styles.timerPill}>
                <Clock size={12} color="#00E5FF" />
                <Text style={styles.timerPillText}>{secondsRemaining}s</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Top Player Cards (Red & Green in 4-player, or all in 2-player) */}
        <View style={styles.playersContainer}>
          {topPlayers.map(renderPlayerCard)}
        </View>

        {/* Turn Status Message Banner */}
        <View style={styles.turnBanner}>
          <Text style={[styles.turnBannerText, label.tone === 'you' ? styles.turnTextYou : styles.turnTextThem]}>
            {label.text}
          </Text>
        </View>

        {/* Board & Animated Dice Container */}
        <View style={[styles.boardWrapper, { width: boardSize, height: boardSize }]}>
          <Board size={boardSize} viewModel={viewModel} onMove={handlePick} legalIds={legalIds} />
          <DiceRoll
            boardSize={boardSize}
            count={diceCount}
            values={displayDice}
            rolling={rolling}
            activeColorIdx={activeColorIdx}
            fadeForPieceMove={Boolean(viewModel?.diceRolled && !rolling)}
            onPress={canRoll ? handleRoll : undefined}
          />
        </View>

        {/* Bottom Player Cards in 4-player (Yellow & Blue, below board before roll the dice) */}
        {isFourPlayer && bottomPlayers.length > 0 && (
          <View style={styles.playersContainerBottom}>
            {bottomPlayers.map(renderPlayerCard)}
          </View>
        )}

        {/* Selectable Dice Choice Chips */}
        {showChips && (
          <View style={styles.chipsRow}>
            {options.map((opt, i) => {
              const enabled = legalPieceIdsForValue(viewModel, opt.value).length > 0;
              const active = selectedValue === opt.value;
              return (
                <TouchableOpacity
                  key={`${opt.value}-${i}`}
                  disabled={!enabled}
                  onPress={() => setSelectedValue(opt.value)}
                  style={[
                    styles.chip,
                    active && styles.chipActive,
                    !enabled && styles.chipDisabled,
                  ]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Roll Dice Action Button */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={[styles.rollBtn, !canRoll && styles.rollBtnDisabled]}
            disabled={!canRoll}
            onPress={handleRoll}
            activeOpacity={0.8}
          >
            {pending ? (
              <ActivityIndicator color="#070A26" size="small" />
            ) : (
              <View style={styles.rollBtnContent}>
                <RotateCw size={19} color={canRoll ? '#070A26' : '#627199'} />
                <Text style={[styles.rollText, !canRoll && styles.rollTextDisabled]}>
                  {buttonLabel}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Modal: Choose token when sharing cell */}
        <Modal
          visible={!!pickerGroup}
          transparent
          animationType="fade"
          onRequestClose={() => setPickerGroup(null)}
        >
          <Pressable style={styles.backdrop} onPress={() => setPickerGroup(null)}>
            <Pressable style={styles.pickerCard} onPress={() => {}}>
              <Text style={styles.pickerTitle}>Which piece to move?</Text>
              <Text style={styles.pickerSub}>
                Multiple pieces share this square — tap the piece you want to move {selectedValue} spaces.
              </Text>
              {(pickerGroup || []).map((p) => (
                <TouchableOpacity
                  key={p.pieceId}
                  style={styles.pickerRow}
                  onPress={() => {
                    const id = p.pieceId;
                    setPickerGroup(null);
                    onMove && onMove(id, selectedValue);
                  }}
                >
                  <View style={[styles.pickerDot, { backgroundColor: p.color }]} />
                  <Text style={styles.pickerText}>
                    {NAME_BY_INDEX[p.colorIdx] || 'Piece'} · Piece #{p.pieceId + 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Modal: Rules & How to Play Online */}
        <Modal
          visible={showRules}
          transparent
          animationType="fade"
          onRequestClose={() => setShowRules(false)}
        >
          <Pressable style={styles.backdrop} onPress={() => setShowRules(false)}>
            <Pressable style={styles.rulesModalCard} onPress={() => {}}>
              <View style={styles.rulesHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Award size={20} color="#00E5FF" />
                  <Text style={styles.rulesTitle}>Rules of Ludo</Text>
                </View>
                <TouchableOpacity
                  style={styles.rulesCloseBtn}
                  onPress={() => setShowRules(false)}
                  accessibilityLabel="Close rules"
                >
                  <X size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.rulesScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.ruleSection}>
                  <View style={styles.ruleHeadingRow}>
                    <Text style={{ fontSize: 16 }}>🎯</Text>
                    <Text style={styles.ruleHeading}>Goal & Objective</Text>
                  </View>
                  <Text style={styles.ruleDesc}>
                    Race all 4 of your colored tokens out of your yard, all the way around the board, and up into the center Home triangle before your opponents do!
                  </Text>
                </View>

                <View style={styles.ruleSection}>
                  <View style={styles.ruleHeadingRow}>
                    <Text style={{ fontSize: 16 }}>🎲</Text>
                    <Text style={styles.ruleHeading}>Opening (Rolling a 6)</Text>
                  </View>
                  <Text style={styles.ruleDesc}>
                    Tokens start locked inside your home yard. You MUST roll a 6 to bring a piece out onto your colored starting star tile.
                  </Text>
                </View>

                <View style={styles.ruleSection}>
                  <View style={styles.ruleHeadingRow}>
                    <Text style={{ fontSize: 16 }}>🎁</Text>
                    <Text style={styles.ruleHeading}>Bonus Rolls (Extra Turns)</Text>
                  </View>
                  <Text style={styles.ruleDesc}>
                    You earn a bonus extra roll whenever:
                    {'\n'}• You roll a 6 (max 2 in a row; a 3rd consecutive 6 is forfeited)
                    {'\n'}• You capture an opponent's token
                    {'\n'}• Your token successfully reaches Home!
                  </Text>
                </View>

                <View style={styles.ruleSection}>
                  <View style={styles.ruleHeadingRow}>
                    <Text style={{ fontSize: 16 }}>⚔️</Text>
                    <Text style={styles.ruleHeading}>Capturing Opponents</Text>
                  </View>
                  <Text style={styles.ruleDesc}>
                    Landing on a square occupied by an opponent's piece captures it and sends it back to their yard, rewarding you with an immediate extra roll!
                  </Text>
                </View>

                <View style={styles.ruleSection}>
                  <View style={styles.ruleHeadingRow}>
                    <ShieldCheck size={16} color="#00E5FF" />
                    <Text style={styles.ruleHeading}>Safe Zones (Star Squares)</Text>
                  </View>
                  <Text style={styles.ruleDesc}>
                    Pieces on the 8 star squares (starting squares & marked stars) are 100% safe and cannot be captured. Opposing pieces can safely share safe squares.
                  </Text>
                </View>

                <View style={styles.ruleSection}>
                  <View style={styles.ruleHeadingRow}>
                    <Text style={{ fontSize: 16 }}>🏁</Text>
                    <Text style={styles.ruleHeading}>Exact Roll to Enter Home</Text>
                  </View>
                  <Text style={styles.ruleDesc}>
                    Tokens enter your colored home column and must roll the exact number needed to land in the center Home. First player to get all tokens home wins!
                  </Text>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.rulesGotItBtn}
                activeOpacity={0.8}
                onPress={() => setShowRules(false)}
              >
                <Text style={styles.rulesGotItText}>GOT IT, LET'S PLAY!</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Error notification banner */}
        {!!error && (
          <View style={styles.banner} pointerEvents="none">
            <Text style={styles.bannerText}>{error}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#070B28',
  },
  root: {
    flex: 1,
    backgroundColor: '#070B28',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: Platform.OS === 'android' ? 24 : 8,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    zIndex: 100,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  statusSubtitle: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timerPillText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '800',
  },
  playersContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
    marginVertical: 4,
  },
  playersContainerBottom: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
    marginVertical: 4,
  },
  noticeToast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 999,
    alignItems: 'center',
  },
  noticeToastInner: {
    backgroundColor: '#0F174A',
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 18,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  noticeToastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  playerCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 28, 68, 0.75)',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 2,
  },
  playerCardActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.14)',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 9,
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#7042FF',
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  turnPulseIndicator: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00E5FF',
    borderWidth: 2,
    borderColor: '#070B28',
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerUsername: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '800',
    maxWidth: 90,
  },
  playerUsernameActive: {
    color: '#FFFFFF',
  },
  playerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 5,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  colorName: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  turnBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 4,
  },
  turnBannerText: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  turnTextYou: {
    color: '#00E5FF',
  },
  turnTextThem: {
    color: '#CBD5E1',
  },
  boardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 6,
  },
  chip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16204A',
    borderWidth: 2,
    borderColor: '#26305C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#00E5FF',
    borderColor: '#00E5FF',
  },
  chipDisabled: {
    opacity: 0.35,
  },
  chipText: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '900',
  },
  chipTextActive: {
    color: '#070B28',
  },
  bottomControls: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  rollBtn: {
    width: '100%',
    maxWidth: 290,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.65,
    shadowRadius: 14,
    elevation: 10,
  },
  rollBtnDisabled: {
    backgroundColor: '#1A2346',
    shadowOpacity: 0,
    elevation: 0,
  },
  rollBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rollText: {
    color: '#070B28',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  rollTextDisabled: {
    color: '#556385',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 28, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#161D42',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#7042FF',
  },
  pickerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  pickerSub: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    marginBottom: 8,
  },
  pickerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  pickerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  rulesModalCard: {
    width: '90%',
    maxHeight: '82%',
    backgroundColor: '#0c1236',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 20,
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 10,
  },
  rulesTitle: {
    color: '#00E5FF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  rulesCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  rulesScroll: {
    maxHeight: 380,
  },
  ruleSection: {
    marginBottom: 14,
  },
  ruleHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  ruleHeading: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  ruleDesc: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
  },
  rulesGotItBtn: {
    marginTop: 14,
    backgroundColor: '#00E5FF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rulesGotItText: {
    color: '#070A26',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  banner: {
    position: 'absolute',
    bottom: 74,
    backgroundColor: '#EF4444',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
