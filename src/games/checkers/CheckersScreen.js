import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { BOARD, BUTTONS, CheckersArtwork } from './CheckersArtwork';
import {
  applyMove,
  checkGameEnd,
  getBestAIMove,
  getHintMove,
  getLegalMovesForSquare,
  initialBoardState,
} from './CheckersEngine';
import { useAuth } from '../../context/AuthContext';
import { recordGameStreak } from '../../utils/recordGameStreak';
import { getAiDifficulty } from '../../utils/aiDifficulty';
import { setActiveMatch, clearActiveMatch, getActiveMatch, updateActiveMatchState } from '../../utils/activeMatch';

function parseTimerSec(timerStr) {
  if (!timerStr) return 120;
  if (typeof timerStr === 'number') return timerStr;
  if (timerStr.endsWith('s')) return parseInt(timerStr, 10);
  if (timerStr.endsWith('m')) return parseInt(timerStr, 10) * 60;
  return 120;
}

export function CheckersScreen({
  board: propBoard,
  timer = '2m',
  secondsRemaining,
  onSquarePress,
  onAction,
  onSoundChange,
  onBack,
  stake = 250,
  onWin,
  playerColor = 'white',
  aiDifficulty = 'auto',
}) {
  const { updateProfileData, userProfile } = useAuth();
  const playerSide = playerColor === 'black' ? 'black' : 'white';
  const aiSide = playerSide === 'white' ? 'black' : 'white';
  const activeDifficulty = getAiDifficulty(userProfile, aiDifficulty);

  const turnDuration = parseTimerSec(timer);
  const [size, setSize] = useState(0);
  const [boardState, setBoardState] = useState(initialBoardState());
  const [turn, setTurn] = useState('white');
  const [selected, setSelected] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [hintMove, setHintMove] = useState(null);
  const [history, setHistory] = useState([]);

  const [vsAI, setVsAI] = useState(true);
  const [sound, setSound] = useState(true);
  const [seconds, setSeconds] = useState(turnDuration);
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [gameOver, setGameOver] = useState({
    isOver: false,
    winner: null,
  });

  // Record daily streak & restore active match session on mount
  const mountStreakRecorded = React.useRef(false);
  useEffect(() => {
    let alive = true;
    getActiveMatch().then((match) => {
      if (alive && match?.gameId === 'checkers' && match?.savedState && !match.savedState?.isOver) {
        const s = match.savedState;
        if (s.boardState) setBoardState(s.boardState);
        if (s.turn) setTurn(s.turn);
        if (s.history) setHistory(s.history);
        if (s.seconds !== undefined) setSeconds(s.seconds);
      } else {
        setActiveMatch({
          gameId: 'checkers',
          gameName: 'Checkers / Draughts',
          targetScreen: 'DraughtsGame',
          durationSecs: 120,
        });
      }
    });

    if (!mountStreakRecorded.current && updateProfileData && userProfile) {
      mountStreakRecorded.current = true;
      recordGameStreak(updateProfileData, userProfile);
    }
    return () => { alive = false; };
  }, []);

  // Persist ongoing state changes to active match session
  useEffect(() => {
    if (gameOver.isOver) {
      clearActiveMatch();
    } else if (boardState) {
      updateActiveMatchState('checkers', { boardState, turn, history, seconds });
    }
  }, [boardState, turn, history, seconds, gameOver.isOver]);

  // Sync external board prop if provided
  useEffect(() => {
    if (propBoard) {
      setBoardState([...propBoard]);
    }
  }, [propBoard]);

  // Reset timer on turn change
  useEffect(() => {
    setSeconds(turnDuration);
  }, [turn, turnDuration]);

  // Timer countdown
  useEffect(() => {
    if (secondsRemaining !== undefined || dialog !== null || gameOver.isOver) return;
    const interval = setInterval(() => setSeconds((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining, dialog, gameOver.isOver]);

  // Handle timer expiration (turn timeout)
  useEffect(() => {
    if (seconds === 0 && !gameOver.isOver && dialog === null) {
      if (turn === playerSide) {
        setGameOver({ isOver: true, winner: aiSide });
        if (updateProfileData && userProfile) recordGameStreak(updateProfileData, userProfile);
        if (onWin) onWin(false);
      } else {
        setTurn(playerSide);
      }
    }
  }, [seconds, gameOver.isOver, dialog, turn, playerSide, aiSide, onWin, updateProfileData, userProfile]);

  // Check if player has 0 legal moves on their turn
  useEffect(() => {
    if (turn === playerSide && !gameOver.isOver && !isAiThinking && dialog === null) {
      let hasMoves = false;
      for (let i = 0; i < 64; i++) {
        const p = boardState[i];
        if (p && p.side === playerSide) {
          const moves = getLegalMovesForSquare(boardState, playerSide, i);
          if (moves.length > 0) {
            hasMoves = true;
            break;
          }
        }
      }
      if (!hasMoves) {
        setGameOver({ isOver: true, winner: aiSide });
        if (updateProfileData && userProfile) recordGameStreak(updateProfileData, userProfile);
        if (onWin) onWin(false);
      }
    }
  }, [turn, playerSide, aiSide, boardState, gameOver.isOver, isAiThinking, dialog, onWin, updateProfileData, userProfile]);

  // Computer AI turn trigger
  useEffect(() => {
    if (vsAI && turn === aiSide && !gameOver.isOver && dialog === null) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const aiMove = getBestAIMove(boardState, aiSide, activeDifficulty);
        if (aiMove) {
          setHistory((prev) => [...prev, { board: [...boardState], turn: aiSide }]);
          const newBoard = applyMove(boardState, aiMove);
          setBoardState(newBoard);

          const endResult = checkGameEnd(newBoard, playerSide);
          if (endResult.isOver) {
            setGameOver(endResult);
            if (updateProfileData && userProfile) recordGameStreak(updateProfileData, userProfile);
            if (onWin) {
              onWin(endResult.winner === playerSide);
            } else {
              setDialog('gameover');
            }
          } else {
            setTurn(playerSide);
          }
        } else {
          // AI has no legal moves -> Player wins
          setGameOver({ isOver: true, winner: playerSide });
          if (updateProfileData && userProfile) recordGameStreak(updateProfileData, userProfile);
          if (onWin) {
            onWin(true);
          } else {
            setDialog('gameover');
          }
        }
        setIsAiThinking(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [turn, vsAI, boardState, gameOver.isOver, dialog, aiSide, playerSide, activeDifficulty, onWin, stake]);

  function restartGame() {
    setBoardState(initialBoardState());
    setTurn('white');
    setSelected(null);
    setValidMoves([]);
    setHintMove(null);
    setHistory([]);
    setGameOver({ isOver: false, winner: null });
    setDialog(null);
    setNotice('');
    setSeconds(296);
  }

  function handleSquarePress(index) {
    if (gameOver.isOver || isAiThinking || (vsAI && turn === 'black')) return;
    onSquarePress?.(index);
    setHintMove(null);

    const piece = boardState[index];

    // If a valid destination is pressed
    if (selected !== null) {
      const selectedMove = validMoves.find((m) => m.to === index);
      if (selectedMove) {
        // Execute move
        setHistory((prev) => [...prev, { board: [...boardState], turn }]);
        const nextBoard = applyMove(boardState, selectedMove);
        setBoardState(nextBoard);
        setSelected(null);
        setValidMoves([]);

        const nextTurn = turn === 'white' ? 'black' : 'white';
        const endResult = checkGameEnd(nextBoard, nextTurn);
        if (endResult.isOver) {
          setGameOver(endResult);
          if (onWin) {
            onWin(endResult.winner === playerSide);
          } else {
            setDialog('gameover');
          }
        } else {
          setTurn(nextTurn);
        }
        return;
      }
    }

    // Select piece
    if (piece && piece.side === turn) {
      const moves = getLegalMovesForSquare(boardState, turn, index);
      if (moves.length > 0) {
        setSelected(index);
        setValidMoves(moves);
      } else {
        setSelected(index);
        setValidMoves([]);
      }
    } else {
      setSelected(null);
      setValidMoves([]);
    }
  }

  function toggleSound() {
    const next = !sound;
    setSound(next);
    onSoundChange?.(next);
  }

  function handleUndo() {
    if (history.length === 0) {
      setNotice('No previous moves to undo.');
      setDialog('undo');
      return;
    }

    if (vsAI) {
      // Revert AI move and player move if available
      const lastPlayerEntry = [...history].reverse().find((h) => h.turn === 'white');
      if (lastPlayerEntry) {
        setBoardState(lastPlayerEntry.board);
        setTurn('white');
        setHistory((prev) => {
          const idx = prev.indexOf(lastPlayerEntry);
          return idx >= 0 ? prev.slice(0, idx) : prev;
        });
      }
    } else {
      const last = history[history.length - 1];
      setBoardState(last.board);
      setTurn(last.turn);
      setHistory((prev) => prev.slice(0, -1));
    }

    setSelected(null);
    setValidMoves([]);
    setHintMove(null);
    setGameOver({ isOver: false, winner: null });
  }

  function handleHint() {
    const hint = getHintMove(boardState, turn);
    if (hint) {
      setHintMove(hint);
      setSelected(hint.from);
      const moves = getLegalMovesForSquare(boardState, turn, hint.from);
      setValidMoves(moves);
    } else {
      setNotice('No legal moves available.');
      setDialog('hint');
    }
  }

  function action(id) {
    if (id === 'back') {
      if (onBack) {
        onBack();
        return;
      }
      setDialog('back');
      onAction?.(id);
      return;
    }
    if (id === 'sound') {
      toggleSound();
      onAction?.(id);
      return;
    }
    if (id === 'undo') {
      handleUndo();
      onAction?.(id);
      return;
    }
    if (id === 'hint') {
      handleHint();
      onAction?.(id);
      return;
    }
    if (id === 'surrender' || id === 'settings' || id === 'signal') {
      setDialog(id);
      onAction?.(id);
      return;
    }
    onAction?.(id);
    setDialog(id);
  }

  const normalized = Array.from({ length: 64 }, (_, i) => boardState[i] ?? null);
  const rawSeconds = secondsRemaining ?? seconds;
  const timeValue = Number.isFinite(rawSeconds) ? Math.max(0, Math.floor(rawSeconds)) : 0;
  const time = `${String(Math.floor(timeValue / 60)).padStart(2, '0')}:${String(
    timeValue % 60
  ).padStart(2, '0')}`;
  const scale = size / 1254;

  function layout(event) {
    const { width, height } = event.nativeEvent.layout;
    setSize(Math.min(width, height));
  }

  const validDests = hintMove ? validMoves.map((m) => m.to) : [];

  return (
    <View style={styles.root} onLayout={layout}>
      {size > 0 && (
        <View style={{ width: size, height: size }}>
          <View pointerEvents="none">
            <CheckersArtwork
              size={size}
              board={normalized}
              selected={selected}
              validDests={validDests}
              hintMove={hintMove}
              time={time}
              muted={!sound}
            />
          </View>
          {normalized.map((piece, index) => {
            const row = Math.floor(index / 8);
            const col = index % 8;
            const isValidTarget = validDests.includes(index);
            return (
              <Pressable
                key={index}
                onPress={() => handleSquarePress(index)}
                style={({ pressed }) => ({
                  position: 'absolute',
                  left: (BOARD.x + (col * BOARD.w) / 8) * scale,
                  top: (BOARD.y + (row * BOARD.h) / 8) * scale,
                  width: (BOARD.w / 8) * scale,
                  height: (BOARD.h / 8) * scale,
                  backgroundColor: isValidTarget
                    ? pressed
                      ? '#5eeaff60'
                      : '#5eeaff20'
                    : pressed
                      ? '#8bdcff25'
                      : 'transparent',
                })}
              />
            );
          })}
          {BUTTONS.map((button) => (
            <Pressable
              key={button.id}
              onPress={() => action(button.id)}
              style={({ pressed }) => ({
                position: 'absolute',
                left: button.x * scale,
                top: button.y * scale,
                width: button.w * scale,
                height: button.h * scale,
                borderRadius: 40 * scale,
                backgroundColor: pressed ? '#ffffff20' : 'transparent',
              })}
            />
          ))}
        </View>
      )}

      <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={() => setDialog(null)}>
        <View style={styles.scrim}>
          <View style={styles.dialog}>
            {dialog === 'surrender' && (
              <>
                <Text style={styles.heading}>Surrender Match 🏳️</Text>
                <Text style={styles.body}>Are you sure you want to surrender this match to Oba? This will be recorded as a loss.</Text>
                <View style={styles.buttons}>
                  <Pressable onPress={() => setDialog(null)} style={styles.modalButton}>
                    <Text style={[styles.buttonText, { color: '#94A3B8' }]}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setDialog(null);
                      setGameOver({ isOver: true, winner: aiSide });
                      if (updateProfileData && userProfile) recordGameStreak(updateProfileData, userProfile);
                      if (onWin) onWin(false);
                    }}
                    style={[styles.modalButton, { marginLeft: 12 }]}
                  >
                    <Text style={[styles.buttonText, { color: '#EF4444' }]}>Resign & Surrender</Text>
                  </Pressable>
                </View>
              </>
            )}

            {dialog === 'back' && (
              <>
                <Text style={styles.heading}>Exit Match</Text>
                <Text style={styles.body}>Do you want to leave the Draughts game board?</Text>
                <View style={styles.buttons}>
                  <Pressable onPress={() => setDialog(null)} style={styles.modalButton}>
                    <Text style={[styles.buttonText, { color: '#94A3B8' }]}>Stay in Game</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setDialog(null);
                      if (onBack) onBack();
                    }}
                    style={[styles.modalButton, { marginLeft: 12 }]}
                  >
                    <Text style={styles.buttonText}>Exit Game</Text>
                  </Pressable>
                </View>
              </>
            )}

            {(dialog === 'undo' || dialog === 'hint') && (
              <>
                <Text style={styles.heading}>{dialog === 'undo' ? 'Undo Move' : 'Move Hint'}</Text>
                <Text style={styles.body}>{notice || 'No information available.'}</Text>
                <View style={styles.buttons}>
                  <Pressable onPress={() => setDialog(null)} style={styles.modalButton}>
                    <Text style={styles.buttonText}>OK</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#061019', alignItems: 'center', justifyContent: 'center' },
  scrim: { flex: 1, backgroundColor: '#000b', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 420, borderRadius: 24, backgroundColor: '#111c27', padding: 24, borderWidth: 1, borderColor: '#ba8a26' },
  heading: { fontSize: 24, fontWeight: '700', color: '#ffd455', marginBottom: 16 },
  body: { fontSize: 16, lineHeight: 24, color: '#edf0f4' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 22, flexWrap: 'wrap' },
  modalButton: { paddingVertical: 12, paddingHorizontal: 15, minHeight: 44 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#ffd455' },
});
