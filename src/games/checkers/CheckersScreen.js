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

  // Record daily streak when player finishes a game
  const handleRecordStreak = React.useCallback(() => {
    if (updateProfileData && userProfile) {
      recordGameStreak(updateProfileData, userProfile);
    }
  }, [updateProfileData, userProfile]);

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
            setDialog('gameover');
            handleRecordStreak();
            if (endResult.winner === playerSide && onWin) {
              onWin(stake);
            }
          } else {
            setTurn(playerSide);
          }
        } else {
          // AI has no legal moves -> Player wins
          setGameOver({ isOver: true, winner: playerSide });
          setDialog('gameover');
          handleRecordStreak();
          if (onWin) onWin(stake);
        }
        setIsAiThinking(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [turn, vsAI, boardState, gameOver.isOver, dialog, aiSide, playerSide, activeDifficulty, handleRecordStreak, onWin, stake]);

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
          setDialog('gameover');
          if (endResult.winner === 'white' && onWin) {
            onWin(stake);
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

  const validDests = validMoves.map((m) => m.to);

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

      {/* Interactive Modals */}
      <Modal visible={dialog !== null} transparent animationType="fade" onRequestClose={() => setDialog(null)}>
        <View style={styles.scrim}>
          <View style={styles.dialog}>
            <Text style={styles.heading}>
              {dialog === 'gameover'
                ? 'Game Over'
                : dialog === 'signal'
                ? 'Game Mode'
                : dialog === 'back'
                ? 'Exit Match'
                : dialog
                ? dialog.charAt(0).toUpperCase() + dialog.slice(1)
                : ''}
            </Text>

            {dialog === 'settings' ? (
              <>
                <View style={styles.settingRow}>
                  <Text style={styles.body}>Single Player (vs AI)</Text>
                  <Switch value={vsAI} onValueChange={(val) => setVsAI(val)} />
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.body}>Sound preference</Text>
                  <Switch value={sound} onValueChange={toggleSound} />
                </View>
              </>
            ) : dialog === 'gameover' ? (
              <Text style={styles.body}>
                {gameOver.winner === playerSide
                  ? `🎉 VICTORY! You won ${Math.floor(stake * 1.9)} Coins!`
                  : gameOver.winner === aiSide
                  ? '👑 Oba Won the Match!'
                  : '🤝 Game ended in a Draw!'}
              </Text>
            ) : dialog === 'surrender' ? (
              <Text style={styles.body}>
                Are you sure you want to surrender this match?
              </Text>
            ) : dialog === 'back' ? (
              <Text style={styles.body}>Return to lobby?</Text>
            ) : dialog === 'signal' ? (
              <Text style={styles.body}>
                Current Mode: {vsAI ? 'Player 1 (White) vs Computer AI (Black)' : '2-Player Local'}
              </Text>
            ) : (
              <Text style={styles.body}>{notice || 'Select a piece to move.'}</Text>
            )}

            <View style={styles.buttons}>
              {dialog === 'gameover' ? (
                <Pressable style={styles.modalButton} onPress={restartGame}>
                  <Text style={styles.buttonText}>Play Again</Text>
                </Pressable>
              ) : dialog === 'surrender' ? (
                <>
                  <Pressable style={styles.modalButton} onPress={() => setDialog(null)}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalButton}
                    onPress={() => {
                      setGameOver({ isOver: true, winner: 'black' });
                      setDialog('gameover');
                    }}
                  >
                    <Text style={styles.buttonText}>Surrender</Text>
                  </Pressable>
                </>
              ) : dialog === 'back' ? (
                <>
                  <Pressable style={styles.modalButton} onPress={() => setDialog(null)}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.modalButton} onPress={onBack ? onBack : () => setDialog(null)}>
                    <Text style={styles.buttonText}>Exit</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  style={styles.modalButton}
                  onPress={() => {
                    setDialog(null);
                    setNotice('');
                  }}
                >
                  <Text style={styles.buttonText}>Close</Text>
                </Pressable>
              )}
            </View>
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
