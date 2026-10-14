import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { BOARD, BUTTONS, CheckersArtwork } from './CheckersArtwork';
import {
  applyMove,
  checkGameEnd,
  getBestAIMove,
  getHintMove,
  getLegalMovesForSquare,
  getSingleCaptureMovesForPiece,
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
  stake = 0,
  onWin,
  playerColor = 'white',
  humanColor = null,
  aiDifficulty = 'auto',
  opponentName = 'Oba',
  isRemote = false,
  remote = null,
  onRemoteMove,
  onControl = null,
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
  const [forcedCaptureSquare, setForcedCaptureSquare] = useState(null);

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

  // Track player move timestamp to enforce 10-second undo window
  const [lastMoveTimestamp, setLastMoveTimestamp] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const ticker = setInterval(() => setCurrentTime(Date.now()), 500);
    return () => clearInterval(ticker);
  }, []);
  const undoSecondsLeft = lastMoveTimestamp
    ? Math.max(0, 10 - Math.floor((currentTime - lastMoveTimestamp) / 1000))
    : 0;

  // Record daily streak & restore active match session on mount
  const mountStreakRecorded = React.useRef(false);
  useEffect(() => {
    let alive = true;
    if (!isRemote) {
      getActiveMatch().then((match) => {
        if (alive && match?.gameId === 'draft' && match?.savedState && !match.savedState?.isOver) {
          const s = match.savedState;
          if (s.boardState) setBoardState(s.boardState);
          if (s.turn) setTurn(s.turn);
          if (s.history) setHistory(s.history);
          if (s.seconds !== undefined) setSeconds(s.seconds);
        } else {
          setActiveMatch({
            gameId: 'draft',
            gameName: 'Checkers / Draughts',
            targetScreen: 'DraughtsGame',
            durationSecs: 120,
          });
        }
      });
    }

    if (!mountStreakRecorded.current && updateProfileData && userProfile) {
      mountStreakRecorded.current = true;
      recordGameStreak(updateProfileData, userProfile);
    }
    return () => { alive = false; };
  }, []);

  // Persist ongoing state changes to active match session
  useEffect(() => {
    if (isRemote) return;
    if (gameOver.isOver) {
      clearActiveMatch();
    } else if (boardState) {
      updateActiveMatchState('draft', { boardState, turn, history, seconds });
    }
  }, [boardState, turn, history, seconds, gameOver.isOver, isRemote]);

  // Remote (server-authoritative) mode: rehydrate the render tree from the
  // server board and respect the server's turn/legality.
  useEffect(() => {
    if (!isRemote || !remote) return;
    setBoardState(remote.board);
    setTurn(remote.turn);
    setSelected(null);
    setValidMoves([]);
    setHintMove(null);
  }, [remote, isRemote]);

  // Sync external board prop if provided
  useEffect(() => {
    if (propBoard) {
      setBoardState([...propBoard]);
    }
  }, [propBoard]);

  // Reset timer & clear hint on turn change
  useEffect(() => {
    setSeconds(turnDuration);
    setHintMove(null);
  }, [turn, turnDuration]);

  // Timer countdown
  useEffect(() => {
    if (secondsRemaining !== undefined || dialog !== null || gameOver.isOver) return;
    const interval = setInterval(() => setSeconds((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining, dialog, gameOver.isOver]);

  // Handle timer expiration (turn timeout - forfeit turn to opponent)
  useEffect(() => {
    if (isRemote) return;
    if (seconds === 0 && !gameOver.isOver && dialog === null) {
      if (turn === playerSide) {
        setTurn(aiSide);
        setNotice(`⏱️ Time's up! Your turn was passed to ${opponentName}.`);
      } else {
        setTurn(playerSide);
        setNotice(`⏱️ ${opponentName} timed out! Your turn.`);
      }
      setSeconds(turnDuration);
    }
  }, [seconds, gameOver.isOver, dialog, turn, playerSide, aiSide, turnDuration, isRemote]);

  // Check if player has 0 legal moves on their turn
  useEffect(() => {
    if (isRemote) return;
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
  }, [turn, playerSide, aiSide, boardState, gameOver.isOver, isAiThinking, dialog, onWin, updateProfileData, userProfile, isRemote]);

  // Computer AI turn trigger
  useEffect(() => {
    if (isRemote) return;
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
  }, [turn, vsAI, boardState, gameOver.isOver, dialog, aiSide, playerSide, activeDifficulty, onWin, stake, isRemote]);

  function restartGame() {
    setBoardState(initialBoardState());
    setTurn('white');
    setSelected(null);
    setValidMoves([]);
    setHintMove(null);
    setHistory([]);
    setForcedCaptureSquare(null);
    setGameOver({ isOver: false, winner: null });
    setDialog(null);
    setNotice('');
    setSeconds(turnDuration);
  }

  function handleRemotePress(index) {
    if (!remote?.canMove) return;
    setHintMove(null);

    // If destination is pressed for currently selected piece
    if (selected !== null) {
      const move = validMoves.find((m) => m.to === index);
      if (move) {
        // Optimistic update for instant, lag-free piece movement
        const nextBoard = applyMove(boardState, move);
        setBoardState(nextBoard);
        setSelected(null);
        setValidMoves([]);
        setHintMove(null);
        setNotice('');
        setLastMoveTimestamp(Date.now());
        onRemoteMove?.(move);
        return;
      }
    }

    // Select piece or switch directly to another friendly piece
    const piece = boardState[index];
    if (piece && piece.side === remote.humanSide) {
      const candidateMoves = Array.isArray(remote.legalMoves) && remote.legalMoves.length > 0
        ? remote.legalMoves.filter((m) => m.from === index)
        : getLegalMovesForSquare(boardState, remote.humanSide, index);

      setSelected(index);
      setValidMoves(candidateMoves);

      if (candidateMoves.length === 0) {
        const hasCapture = Array.isArray(remote.legalMoves) &&
          remote.legalMoves.some((m) => m.captures && m.captures.length > 0);
        if (hasCapture) {
          setNotice('⚔️ Mandatory Jump: You must capture an opponent piece with another piece!');
        }
      } else {
        setNotice('');
      }
    } else {
      setSelected(null);
      setValidMoves([]);
    }
  }

  function handleSquarePress(index) {
    if (isRemote) {
      handleRemotePress(index);
      return;
    }
    if (gameOver.isOver || isAiThinking || (vsAI && turn === aiSide)) return;
    onSquarePress?.(index);
    setHintMove(null);

    const piece = boardState[index];

    // If a valid destination is pressed
    if (selected !== null) {
      const selectedMove = validMoves.find((m) => m.to === index);
      if (selectedMove) {
        const movingPiece = boardState[selectedMove.from];
        setHistory((prev) => [...prev, { board: [...boardState], turn }]);
        const nextBoard = applyMove(boardState, selectedMove);
        setBoardState(nextBoard);
        setSelected(null);
        setValidMoves([]);
        setHintMove(null);
        setLastMoveTimestamp(Date.now());

        const wasCapture = selectedMove.captures && selectedMove.captures.length > 0;
        const destR = Math.floor(selectedMove.to / 8);
        const crowned = movingPiece && !movingPiece.king &&
          ((movingPiece.side === 'white' && destR === 7) || (movingPiece.side === 'black' && destR === 0));

        // In standard Draughts, if capture was made and piece was not crowned this turn, check for multi-jump
        if (wasCapture && !crowned) {
          const pieceAtDest = nextBoard[selectedMove.to];
          const moreCaptures = getSingleCaptureMovesForPiece(nextBoard, selectedMove.to, pieceAtDest);
          if (moreCaptures.length > 0) {
            setSelected(selectedMove.to);
            setValidMoves(moreCaptures);
            setForcedCaptureSquare(selectedMove.to);
            setNotice('Double jump! You must continue capturing.');
            return;
          }
        }

        setForcedCaptureSquare(null);
        setNotice('');
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

    // Select piece or switch directly to another friendly piece
    if (piece && piece.side === turn) {
      if (forcedCaptureSquare !== null && index !== forcedCaptureSquare) {
        setNotice('⚔️ Complete your multi-jump with the active piece!');
        return;
      }
      const moves = getLegalMovesForSquare(boardState, turn, index, forcedCaptureSquare);
      setSelected(index);
      setValidMoves(moves);
      if (moves.length === 0) {
        setNotice('⚔️ Mandatory Jump: You must capture an opponent piece with another piece!');
      } else {
        setNotice('');
      }
    } else {
      if (forcedCaptureSquare === null) {
        setSelected(null);
        setValidMoves([]);
      }
    }
  }

  function toggleSound() {
    const next = !sound;
    setSound(next);
    onSoundChange?.(next);
  }

  function handleUndo() {
    if (!lastMoveTimestamp || undoSecondsLeft <= 0) {
      setNotice('Undo is only allowed within 10 seconds of making a move.');
      setDialog('undo');
      return;
    }

    if (isRemote) {
      if (onControl) {
        onControl('undo');
        setSelected(null);
        setValidMoves([]);
        setHintMove(null);
        setLastMoveTimestamp(null);
      }
      return;
    }
    if (history.length === 0) {
      setNotice('No previous moves to undo.');
      setDialog('undo');
      return;
    }

    if (vsAI) {
      // Revert AI move and player move if available
      const lastPlayerEntry = [...history].reverse().find((h) => h.turn === playerSide);
      if (lastPlayerEntry) {
        setBoardState(lastPlayerEntry.board);
        setTurn(playerSide);
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
    setForcedCaptureSquare(null);
    setNotice('');
    setGameOver({ isOver: false, winner: null });
    setLastMoveTimestamp(null);
  }

  async function handleHint() {
    if (isRemote) {
      if (!onControl) return;
      const reply = await onControl('hint');
      const move = reply?.move;
      if (!move || move.fromRow == null) {
        setNotice('No legal moves available.');
        setDialog('hint');
        return;
      }
      const from = move.fromRow * 8 + move.fromCol;
      const to = move.toRow * 8 + move.toCol;
      setHintMove({ from, to });
      setSelected(from);
      setValidMoves(getLegalMovesForSquare(boardState, turn, from));
      return;
    }
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

  // Always seat the human player at the bottom of the board. Engine 'white'
  // occupies the top rows and moves down, so when the human is white rotate
  // the view 180 degrees (index -> 63 - index) to bring their pieces home.
  const humanSide = isRemote ? (remote?.humanSide || playerSide) : playerSide;
  const flip = humanSide === 'white';
  const toDisplay = (i) => (i == null ? i : flip ? 63 - i : i);
  // The server always seats the human on the same side in practice, so render
  // the chosen colour client-side: swap which side the human's discs show as.
  const humanDisplayColor = humanColor || humanSide;
  const swapColors = humanDisplayColor !== humanSide;
  const swapSide = (s) => (swapColors ? (s === 'white' ? 'black' : 'white') : s);
  const normalized = Array.from({ length: 64 }, (_, d) => {
    const piece = boardState[toDisplay(d)];
    return piece ? { ...piece, side: swapSide(piece.side) } : null;
  });
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

  const validDests = (selected != null || hintMove ? validMoves : []).map((m) => toDisplay(m.to));
  const displaySelected = selected == null ? null : toDisplay(selected);
  const displayHint = hintMove ? { from: toDisplay(hintMove.from), to: toDisplay(hintMove.to) } : null;
  const myName = userProfile?.username || userProfile?.displayName || 'You';
  const whiteName = humanDisplayColor === 'white' ? myName : opponentName;
  const blackName = humanDisplayColor === 'black' ? myName : opponentName;

  return (
    <View style={styles.root} onLayout={layout}>
      {size > 0 && (
        <View style={{ width: size, height: size }}>
          <View pointerEvents="none">
            <CheckersArtwork
              size={size}
              board={normalized}
              selected={displaySelected}
              validDests={validDests}
              hintMove={displayHint}
              whiteName={whiteName}
              blackName={blackName}
              time={time}
              muted={!sound}
              undoSecondsLeft={undoSecondsLeft}
            />
          </View>
          {normalized.map((piece, index) => {
            const row = Math.floor(index / 8);
            const col = index % 8;
            const isValidTarget = validDests.includes(index);
            return (
              <Pressable
                key={index}
                onPress={() => handleSquarePress(toDisplay(index))}
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
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
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

      {!!notice && (
        <View style={styles.noticeToast} pointerEvents="none">
          <Text style={styles.noticeToastText}>{notice}</Text>
        </View>
      )}

      <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={() => setDialog(null)}>
        <View style={styles.scrim}>
          <View style={styles.dialog}>
            {dialog === 'settings' && (
              <>
                <Text style={styles.heading}>Game Settings ⚙️</Text>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Sound Effects</Text>
                  <Switch
                    value={sound}
                    onValueChange={toggleSound}
                    trackColor={{ false: '#334155', true: '#ba8a26' }}
                    thumbColor={sound ? '#ffd455' : '#94a3b8'}
                  />
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Dráfù Rules</Text>
                  <Pressable
                    onPress={() => setDialog('rules')}
                    style={[styles.smallBtn, { backgroundColor: '#1e293b' }]}
                  >
                    <Text style={[styles.buttonText, { fontSize: 14 }]}>View Rules 📜</Text>
                  </Pressable>
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Surrender Match</Text>
                  <Pressable
                    onPress={() => setDialog('surrender')}
                    style={[styles.smallBtn, { backgroundColor: '#7f1d1d' }]}
                  >
                    <Text style={[styles.buttonText, { color: '#fca5a5', fontSize: 14 }]}>Resign 🏳️</Text>
                  </Pressable>
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Exit to Lobby</Text>
                  <Pressable
                    onPress={() => setDialog('back')}
                    style={[styles.smallBtn, { backgroundColor: '#334155' }]}
                  >
                    <Text style={[styles.buttonText, { color: '#e2e8f0', fontSize: 14 }]}>Exit 🚪</Text>
                  </Pressable>
                </View>
                <View style={styles.buttons}>
                  <Pressable onPress={() => setDialog(null)} style={[styles.modalButton, styles.primaryBtn]}>
                    <Text style={[styles.buttonText, { color: '#000' }]}>Done</Text>
                  </Pressable>
                </View>
              </>
            )}

            {dialog === 'rules' && (
              <>
                <Text style={styles.heading}>Dráfù Rules 📜</Text>
                <Text style={styles.ruleItem}>• Played on an 8x8 dark-square board with 12 pieces each.</Text>
                <Text style={styles.ruleItem}>• Regular pieces move diagonally forward 1 square.</Text>
                <Text style={styles.ruleItem}>• ⚔️ Capture is mandatory! When a jump is available, you must jump.</Text>
                <Text style={styles.ruleItem}>• Multi-jump: If another jump is available with the same piece, you must continue jumping.</Text>
                <Text style={styles.ruleItem}>• King Promotion: Reaching the opposite end crowns your piece to a King.</Text>
                <Text style={styles.ruleItem}>• ⏱️ Undo: Only allowed within 10 seconds of making a move.</Text>
                <View style={styles.buttons}>
                  <Pressable onPress={() => setDialog('settings')} style={styles.modalButton}>
                    <Text style={styles.buttonText}>Settings</Text>
                  </Pressable>
                  <Pressable onPress={() => setDialog(null)} style={[styles.modalButton, styles.primaryBtn, { marginLeft: 10 }]}>
                    <Text style={[styles.buttonText, { color: '#000' }]}>Got it</Text>
                  </Pressable>
                </View>
              </>
            )}

            {dialog === 'surrender' && (
              <>
                <Text style={styles.heading}>Surrender Match 🏳️</Text>
                <Text style={styles.body}>Are you sure you want to surrender this match to {opponentName}? This will be recorded as a loss.</Text>
                <View style={styles.buttons}>
                  <Pressable onPress={() => setDialog(null)} style={styles.modalButton}>
                    <Text style={[styles.buttonText, { color: '#94A3B8' }]}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setDialog(null);
                      if (isRemote) {
                        if (onControl) onControl('surrender');
                        return;
                      }
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
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  settingLabel: { fontSize: 16, fontWeight: '600', color: '#f1f5f9' },
  ruleItem: { fontSize: 14, lineHeight: 22, color: '#cbd5e1', marginBottom: 8 },
  primaryBtn: { backgroundColor: '#ffd455', borderRadius: 12, paddingHorizontal: 20 },
  smallBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: '#ba8a2655' },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 22, flexWrap: 'wrap' },
  modalButton: { paddingVertical: 12, paddingHorizontal: 15, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#ffd455' },
  noticeToast: {
    position: 'absolute',
    top: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1.5,
    borderColor: '#ffd455',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    zIndex: 999,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  noticeToastText: { color: '#ffd455', fontSize: 13, fontWeight: '700', textAlign: 'center' },
});
