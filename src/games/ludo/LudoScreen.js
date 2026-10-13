import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { ArrowLeft, RotateCw } from 'lucide-react-native';
import Board from './Board';
import DiceRoll from './DiceRoll';
import { diceOptions, legalPieceIdsForValue, NAME_BY_INDEX } from './serverAdapter';

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

function turnLabel(viewModel, status, selectedValue) {
  if (!viewModel) return { text: 'Loading…', tone: 'muted' };
  if (status === 'completed' || viewModel.status === 'completed') return { text: 'Match over', tone: 'muted' };
  if (status === 'error') return { text: 'Connection problem', tone: 'error' };
  if (viewModel.isMyTurn) {
    if (!viewModel.diceRolled) return { text: 'Your turn — roll the dice', tone: 'you' };
    if (selectedValue == null) return { text: 'Choose a number', tone: 'you' };
    return { text: 'Tap a highlighted piece to move', tone: 'you' };
  }
  const current = viewModel.players?.[viewModel.currentPlayerIndex];
  return { text: `${current?.name || 'Opponent'} is playing…`, tone: 'them' };
}

export default function LudoScreen({
  viewModel,
  isRemote = true,
  status = 'playing',
  secondsRemaining = null,
  error = '',
  canMove = false,
  pending = false,
  onRoll,
  onMove,
  onBack,
}) {
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 24, 400);

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
    setSelectedValue(movable.length === 1 ? movable[0] : null);
  }, [diceSig, viewModel?.diceRolled, viewModel?.currentPlayerIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const legalIds = useMemo(
    () => (selectedValue == null ? [] : legalPieceIdsForValue(viewModel, selectedValue)),
    [viewModel, selectedValue],
  );

  const canRoll = !!(
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
    onMove && onMove(pieceId, selectedValue);
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

  // Ludo is played with two dice. Keep both visible in the centre before and
  // after a roll; a dual roll exposes die one, die two, and their sum.
  const diceCount = 2;
  const displayDice = rolling ? [] : viewModel?.dice?.length ? viewModel.dice : lastDice;
  const label = turnLabel(viewModel, status, selectedValue);

  let buttonLabel = 'ROLL DICE';
  if (viewModel?.diceRolled && viewModel?.isMyTurn) {
    buttonLabel = selectedValue == null ? 'CHOOSE A NUMBER' : 'SELECT A PIECE';
  }
  const showChips = isRemote && viewModel?.isMyTurn && viewModel?.diceRolled && options.length > 0;

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Ludo</Text>
        <View style={styles.backBtn} />
      </View>

      <Text style={styles.turnText}>{label.text}</Text>

      <View style={{ width: boardSize, height: boardSize }}>
        <Board size={boardSize} viewModel={viewModel} onMove={handlePick} legalIds={legalIds} />
        <DiceRoll boardSize={boardSize} count={diceCount} values={displayDice} rolling={rolling} />
      </View>

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

      <TouchableOpacity
        style={[styles.rollBtn, !canRoll && styles.rollBtnDisabled]}
        disabled={!canRoll}
        onPress={handleRoll}
      >
        {pending ? (
          <ActivityIndicator color="#0B113A" />
        ) : (
          <>
            <RotateCw size={20} color={canRoll ? '#0B113A' : '#5b6b8f'} />
            <Text style={[styles.rollText, !canRoll && styles.rollTextDisabled]}>{buttonLabel}</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.statusRow}>
        <Text style={styles.statusText}>{STATUS_TEXT[status] || status}</Text>
        {secondsRemaining != null && <Text style={styles.timerText}>{secondsRemaining}s</Text>}
      </View>

      <View style={styles.playersRow}>
        {(viewModel?.players || []).map((p) => {
          const active = p.index === viewModel?.currentPlayerIndex;
          return (
            <View key={p.index} style={[styles.playerChip, active && styles.playerChipActive]}>
              <View style={[styles.playerDot, { backgroundColor: p.color }]} />
              <Text style={[styles.playerName, active && styles.playerNameActive]} numberOfLines={1}>
                {p.name}
              </Text>
            </View>
          );
        })}
      </View>

      <Modal
        visible={!!pickerGroup}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerGroup(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setPickerGroup(null)}>
          <Pressable style={styles.pickerCard} onPress={() => {}}>
            <Text style={styles.pickerTitle}>Which piece?</Text>
            <Text style={styles.pickerSub}>
              These pieces share a square — pick one to move {selectedValue}.
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
                  {NAME_BY_INDEX[p.colorIdx] || 'Piece'} · piece {p.pieceId + 1}
                </Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {!!error && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B113A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  turnText: { color: '#9fb0d0', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  chipsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  chip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#16204a',
    borderWidth: 1,
    borderColor: '#26305c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: '#00E5FF', borderColor: '#00E5FF' },
  chipDisabled: { opacity: 0.35 },
  chipText: { color: '#c7d2ff', fontSize: 18, fontWeight: '800' },
  chipTextActive: { color: '#0B113A' },
  rollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    backgroundColor: '#00E5FF',
  },
  rollBtnDisabled: { backgroundColor: '#1b2350' },
  rollText: { color: '#0B113A', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  rollTextDisabled: { color: '#5b6b8f' },
  statusRow: { flexDirection: 'row', gap: 10, marginTop: 12, alignItems: 'center' },
  statusText: { color: '#6f7fa8', fontSize: 12, fontWeight: '700' },
  timerText: { color: '#FFD224', fontSize: 12, fontWeight: '800' },
  playersRow: { flexDirection: 'row', gap: 12, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#141d44',
  },
  playerChipActive: { backgroundColor: '#243063' },
  playerDot: { width: 10, height: 10, borderRadius: 5 },
  playerName: { color: '#9fb0d0', fontSize: 12, fontWeight: '600' },
  playerNameActive: { color: '#FFFFFF', fontWeight: '800' },
  banner: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  bannerText: { color: '#FFD224', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#141d44',
    borderRadius: 18,
    padding: 20,
    gap: 10,
  },
  pickerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  pickerSub: { color: '#9fb0d0', fontSize: 13, marginBottom: 6 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#1d2856',
  },
  pickerDot: { width: 18, height: 18, borderRadius: 9 },
  pickerText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
