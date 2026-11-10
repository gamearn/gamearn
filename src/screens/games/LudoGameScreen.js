import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import LudoScreen from '../../games/ludo/LudoScreen';
import { useServerGame } from '../../games/useServerGame';
import { useAuth } from '../../context/AuthContext';
import { ludoViewModel, diceValueForMove, START_RING, SAFE_RING } from '../../games/ludo/serverAdapter';
import { setActiveMatch, clearActiveMatch } from '../../utils/activeMatch';
import CoinTossModal from '../../components/CoinTossModal';

function computeStepOutcome(piece, colorIdx, steps) {
  if (!piece || piece.completed) return null;
  const startPos = START_RING[colorIdx] ?? 0;
  if (piece.position == null || piece.position < 0) {
    if (steps === 6) {
      return {
        position: startPos,
        inHomeStretch: false,
        homePosition: 0,
        completed: false,
        colorIdx,
        action: 'enter',
      };
    }
    return null;
  }
  if (piece.inHomeStretch) {
    const nextHome = (piece.homePosition || 1) + steps;
    if (nextHome > 6) return null;
    return {
      position: piece.position,
      inHomeStretch: nextHome < 6,
      homePosition: nextHome,
      completed: nextHome === 6,
      colorIdx,
      action: nextHome === 6 ? 'home' : 'advance',
    };
  }
  const dist = (piece.position - startPos + 52) % 52;
  const newDist = dist + steps;
  if (newDist <= 50) {
    return {
      position: (startPos + newDist) % 52,
      inHomeStretch: false,
      homePosition: 0,
      completed: false,
      colorIdx,
      action: 'advance',
    };
  }
  const homePos = newDist - 50;
  if (homePos > 6) return null;
  return {
    position: piece.position,
    inHomeStretch: homePos < 6,
    homePosition: homePos,
    completed: homePos === 6,
    colorIdx,
    action: homePos === 6 ? 'home' : 'advance',
  };
}

function computeLegalMovesForPlayer(player, colorIdx, diceValues) {
  if (!player || !Array.isArray(player.pieces) || !Array.isArray(diceValues) || !diceValues.length) {
    return [];
  }
  const candidateValues = [...new Set([
    ...diceValues,
    ...(diceValues.length === 2 ? [diceValues[0] + diceValues[1]] : []),
  ])];
  const moves = [];
  player.pieces.forEach((piece, pieceId) => {
    candidateValues.forEach((val) => {
      // Only a single 6 (not 3+3=6) can bring a piece out of the yard
      if ((piece.position == null || piece.position < 0) && !diceValues.includes(6)) {
        return;
      }
      const next = computeStepOutcome(piece, colorIdx, val);
      if (next) {
        moves.push({ pieceId, diceValue: val, next });
      }
    });
  });
  return moves;
}

export default function LudoGameScreen({ route, navigation }) {
  const { user, userProfile } = useAuth();
  const params = route.params || {};
  const isRejoin = !!params.isRejoin;
  const mode = params.mode === 'multiplayer' ? 'multiplayer' : 'practice';
  const multiplayer = mode === 'multiplayer' && !!params.roomId;
  const roomId = multiplayer ? params.roomId || null : null;
  const uid = user?.uid || 'practice_user';
  const stake = params.stake || 0;
  const playerCount = Math.max(2, Math.min(4, Number(params.players || params.playerCount || 2)));
  const tokenCount = Math.max(1, Math.min(4, Number(params.tokens || params.tokenCount || 4)));
  const diceCount = params.diceCount || 2;
  const timer = params.timer || '2m';

  const [showCoinToss, setShowCoinToss] = useState(!isRejoin);

  useEffect(() => {
    if (!isRejoin) {
      clearActiveMatch();
    }
    setActiveMatch({
      gameId: 'ludo',
      gameName: 'Ludo',
      targetScreen: 'LudoGame',
      params: route.params,
    });
  }, [isRejoin]);

  const options = useMemo(
    () => ({ playerCount, diceCount, tokenCount, timer }),
    [playerCount, diceCount, tokenCount, timer],
  );

  // Only connect to remote socket when in a live multiplayer room; practice runs 100% locally in 0ms
  const session = useServerGame({
    gameType: multiplayer ? 'ludo' : null,
    roomId,
    uid: multiplayer ? uid : null,
    options,
  });

  const myName = userProfile?.username || userProfile?.displayName || 'You';

  const createInitialLocalSnapshot = useCallback(() => {
    const colorMap = playerCount === 2 ? [0, 2] : [0, 1, 2, 3];
    const players = [
      {
        uid,
        displayName: `${myName} (You)`,
        color: colorMap[0],
        colorIdx: colorMap[0],
        pieces: Array.from({ length: tokenCount }, () => ({
          position: -1,
          inHomeStretch: false,
          homePosition: 0,
          completed: false,
          colorIdx: colorMap[0],
        })),
      },
    ];
    for (let i = 1; i < playerCount; i++) {
      const cIdx = colorMap[i] ?? i;
      players.push({
        uid: `bot_practice_${i}`,
        displayName: i === 1 ? 'Oba 👑' : `Oba ${i + 1} 👑`,
        color: cIdx,
        colorIdx: cIdx,
        pieces: Array.from({ length: tokenCount }, () => ({
          position: -1,
          inHomeStretch: false,
          homePosition: 0,
          completed: false,
          colorIdx: cIdx,
        })),
      });
    }
    return {
      players,
      status: 'playing',
      currentPlayerIndex: 0,
      currentPlayerUid: uid,
      diceRolled: false,
      diceValue: null,
      diceValues: [],
      rolledDice: [],
      legalPieceIds: [],
      legalMoves: [],
      mustPass: false,
      winner: null,
      coinToss: { winnerIndex: 0 },
    };
  }, [uid, myName, playerCount, tokenCount]);

  const [localState, setLocalState] = useState(() => createInitialLocalSnapshot());

  useEffect(() => {
    setLocalState(createInitialLocalSnapshot());
  }, [createInitialLocalSnapshot, params.resetKey]);

  const applyMoveToSnapshot = useCallback((prev, pieceId, usedValue) => {
    const pIdx = prev.currentPlayerIndex || 0;
    const currentPlayer = prev.players[pIdx];
    if (!currentPlayer) return prev;
    const colorIdx = currentPlayer.colorIdx ?? pIdx;
    const piece = currentPlayer.pieces[pieceId];
    const outcome = computeStepOutcome(piece, colorIdx, usedValue);
    if (!outcome) return prev;

    const newPlayers = prev.players.map((pl, idx) => ({
      ...pl,
      pieces: pl.pieces.map((pc) => ({ ...pc })),
    }));

    const movedPiece = {
      position: outcome.position,
      inHomeStretch: outcome.inHomeStretch,
      homePosition: outcome.homePosition,
      completed: outcome.completed,
      colorIdx,
    };
    newPlayers[pIdx].pieces[pieceId] = movedPiece;

    // Check captures on main track if not in home stretch and not on safe zone
    let captured = false;
    if (!movedPiece.inHomeStretch && movedPiece.position >= 0 && !SAFE_RING.includes(movedPiece.position)) {
      newPlayers.forEach((otherPl, otherIdx) => {
        if (otherIdx === pIdx) return;
        otherPl.pieces.forEach((otherPc, otherPcIdx) => {
          if (!otherPc.completed && !otherPc.inHomeStretch && otherPc.position === movedPiece.position) {
            newPlayers[otherIdx].pieces[otherPcIdx] = {
              ...otherPc,
              position: -1,
              inHomeStretch: false,
              homePosition: 0,
              completed: false,
            };
            captured = true;
          }
        });
      });
    }

    // Check if current player won
    const allHome = newPlayers[pIdx].pieces.every((pc) => pc.completed);
    if (allHome) {
      return {
        ...prev,
        players: newPlayers,
        status: 'completed',
        winner: currentPlayer.uid,
        diceValues: [],
        legalMoves: [],
        legalPieceIds: [],
      };
    }

    // Consume dice value(s)
    let remainingDice = [...(prev.diceValues || [])];
    const directIdx = remainingDice.indexOf(usedValue);
    if (directIdx !== -1) {
      remainingDice.splice(directIdx, 1);
    } else if (remainingDice.length === 2 && remainingDice[0] + remainingDice[1] === usedValue) {
      remainingDice = [];
    } else {
      remainingDice.shift();
    }

    const rolledSix = Array.isArray(prev.rolledDice) && prev.rolledDice.includes(6);

    if (remainingDice.length > 0) {
      const nextLegal = computeLegalMovesForPlayer(newPlayers[pIdx], colorIdx, remainingDice);
      if (nextLegal.length > 0) {
        return {
          ...prev,
          players: newPlayers,
          diceValues: remainingDice,
          legalMoves: nextLegal,
          legalPieceIds: [...new Set(nextLegal.map((m) => m.pieceId))],
          mustPass: false,
          lastBotAction: pIdx > 0 ? { action: outcome.action, capture: captured, diceValue: usedValue } : prev.lastBotAction,
        };
      }
    }

    // If rolled a 6 or captured, grant bonus roll
    if (rolledSix || captured) {
      return {
        ...prev,
        players: newPlayers,
        diceRolled: false,
        diceValues: [],
        legalMoves: [],
        legalPieceIds: [],
        mustPass: false,
        botPhase: pIdx > 0 ? 'rolling' : null,
      };
    }

    // Advance turn to next player
    const nextIdx = (pIdx + 1) % newPlayers.length;
    return {
      ...prev,
      players: newPlayers,
      currentPlayerIndex: nextIdx,
      currentPlayerUid: newPlayers[nextIdx].uid,
      diceRolled: false,
      diceValues: [],
      legalMoves: [],
      legalPieceIds: [],
      mustPass: false,
      botPhase: nextIdx > 0 ? 'rolling' : null,
      botName: nextIdx > 0 ? newPlayers[nextIdx].displayName : null,
    };
  }, []);

  // Bot turn automation in local practice mode
  useEffect(() => {
    if (multiplayer || showCoinToss || localState.status !== 'playing') return;
    const pIdx = localState.currentPlayerIndex || 0;
    if (pIdx === 0) return; // Human turn

    const botPlayer = localState.players[pIdx];
    if (!botPlayer) return;
    const colorIdx = botPlayer.colorIdx ?? pIdx;

    if (!localState.diceRolled) {
      const t = setTimeout(() => {
        const d1 = 1 + Math.floor(Math.random() * 6);
        const d2 = 1 + Math.floor(Math.random() * 6);
        const roll = diceCount === 1 ? [d1] : [d1, d2];
        const moves = computeLegalMovesForPlayer(botPlayer, colorIdx, roll);
        setLocalState((prev) => ({
          ...prev,
          diceRolled: true,
          diceValues: roll,
          rolledDice: roll,
          botRoll: roll,
          botName: botPlayer.displayName,
          botPhase: 'rolled',
          legalMoves: moves,
          legalPieceIds: [...new Set(moves.map((m) => m.pieceId))],
          mustPass: moves.length === 0,
        }));
      }, 650);
      return () => clearTimeout(t);
    }

    if (localState.mustPass || (localState.legalMoves || []).length === 0) {
      const t = setTimeout(() => {
        setLocalState((prev) => {
          const nextIdx = (pIdx + 1) % prev.players.length;
          return {
            ...prev,
            currentPlayerIndex: nextIdx,
            currentPlayerUid: prev.players[nextIdx].uid,
            diceRolled: false,
            diceValues: [],
            legalMoves: [],
            legalPieceIds: [],
            mustPass: false,
            botPhase: nextIdx > 0 ? 'rolling' : null,
          };
        });
      }, 900);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      setLocalState((prev) => {
        const moves = prev.legalMoves || [];
        if (!moves.length) return prev;
        // Prefer entering from yard on 6, then finishing home, then moving furthest
        const enterMove = moves.find((m) => m.next?.action === 'enter');
        const homeMove = moves.find((m) => m.next?.action === 'home');
        const chosen = enterMove || homeMove || moves[0];
        return applyMoveToSnapshot(prev, chosen.pieceId, chosen.diceValue);
      });
    }, 850);
    return () => clearTimeout(t);
  }, [multiplayer, showCoinToss, localState, diceCount, applyMoveToSnapshot]);

  // Auto-pass for human player when no legal moves after rolling
  useEffect(() => {
    if (multiplayer || showCoinToss || localState.status !== 'playing') return;
    if (localState.currentPlayerIndex === 0 && localState.diceRolled && localState.mustPass) {
      const t = setTimeout(() => {
        setLocalState((prev) => {
          const nextIdx = 1 % prev.players.length;
          return {
            ...prev,
            currentPlayerIndex: nextIdx,
            currentPlayerUid: prev.players[nextIdx].uid,
            diceRolled: false,
            diceValues: [],
            legalMoves: [],
            legalPieceIds: [],
            mustPass: false,
            botPhase: nextIdx > 0 ? 'rolling' : null,
          };
        });
      }, 1100);
      return () => clearTimeout(t);
    }
  }, [multiplayer, showCoinToss, localState.status, localState.currentPlayerIndex, localState.diceRolled, localState.mustPass]);

  const activeSnapshot = multiplayer ? (session.snapshot || localState) : localState;
  const viewModel = useMemo(() => ludoViewModel(activeSnapshot, uid), [activeSnapshot, uid]);

  const ludoPlayers = useMemo(() => {
    if (activeSnapshot?.players && activeSnapshot.players.length > 0) {
      return activeSnapshot.players.map((p, idx) => ({
        id: idx,
        name: p.uid === uid ? `${myName} (You)` : (p.displayName || p.name || (idx === 1 ? 'Oba 👑' : `Player ${idx + 1}`)),
        isUser: p.uid === uid,
        isAi: p.uid !== uid,
      }));
    }
    const players = [{ id: 0, name: `${myName} (You)`, isUser: true }];
    for (let i = 1; i < playerCount; i++) {
      players.push({ id: i, name: i === 1 ? 'Oba 👑' : `Player ${i + 1}`, isAi: true });
    }
    return players;
  }, [activeSnapshot?.players, uid, myName, playerCount]);

  const navigated = useRef(false);
  useEffect(() => {
    if (activeSnapshot?.status !== 'completed' || navigated.current) return;
    const timerId = setTimeout(() => {
      if (navigated.current) return;
      navigated.current = true;
      const opponent = activeSnapshot.players?.find((p) => p.uid !== uid);
      navigation.replace('GameResult', {
        serverConfirmed: multiplayer,
        isWinner: activeSnapshot.winner === uid,
        isDraw: activeSnapshot.winner == null,
        completionReason: activeSnapshot.completionReason || 'normal',
        myScore: null,
        opponentScore: null,
        opponentName:
          typeof opponent?.uid === 'string' && opponent.uid.indexOf('bot') === 0
            ? 'Oba 👑'
            : opponent?.username || opponent?.displayName || 'Oba 👑',
        gameId: 'ludo',
        gameName: 'Ludo',
        targetScreen: 'LudoGame',
        stake: multiplayer ? stake : 0,
        matchSettings: { ...params, mode, playerCount, tokenCount, diceCount, timer },
      });
    }, 800);
    return () => clearTimeout(timerId);
  }, [activeSnapshot, uid, navigation, multiplayer, stake, mode, params, playerCount, tokenCount, diceCount, timer]);

  const handleBack = () => {
    navigation.navigate('GameLobby', {
      gameId: 'ludo',
      gameName: 'Ludo',
      targetScreen: 'LudoGame',
    });
  };

  const handleRoll = () => {
    if (multiplayer && session.snapshot) {
      session.move({ action: 'roll_dice' });
      return;
    }
    setLocalState((prev) => {
      if (prev.currentPlayerIndex !== 0 || prev.diceRolled) return prev;
      const human = prev.players[0];
      const colorIdx = human.colorIdx ?? 0;
      const d1 = 1 + Math.floor(Math.random() * 6);
      const d2 = 1 + Math.floor(Math.random() * 6);
      const roll = diceCount === 1 ? [d1] : [d1, d2];
      const moves = computeLegalMovesForPlayer(human, colorIdx, roll);
      return {
        ...prev,
        diceRolled: true,
        diceValues: roll,
        rolledDice: roll,
        legalMoves: moves,
        legalPieceIds: [...new Set(moves.map((m) => m.pieceId))],
        mustPass: moves.length === 0,
      };
    });
  };

  const handleMove = (pieceId, value) => {
    const diceValue = value ?? diceValueForMove(viewModel, pieceId);
    if (diceValue == null) return;
    if (multiplayer && session.snapshot) {
      session.move({ pieceId, diceValue });
      return;
    }
    setLocalState((prev) => applyMoveToSnapshot(prev, pieceId, diceValue));
  };

  const handleCoinTossComplete = (winnerIdx) => {
    setShowCoinToss(false);
    if (!multiplayer && typeof winnerIdx === 'number' && winnerIdx > 0 && winnerIdx < playerCount) {
      setLocalState((prev) => ({
        ...prev,
        currentPlayerIndex: winnerIdx,
        currentPlayerUid: prev.players[winnerIdx]?.uid || prev.currentPlayerUid,
        botPhase: 'rolling',
      }));
    }
  };

  const canAct = multiplayer
    ? (session.canMove && !showCoinToss)
    : (!showCoinToss && viewModel?.isMyTurn && activeSnapshot?.status === 'playing');

  return (
    <View style={styles.container}>
      {viewModel ? (
        <LudoScreen
          viewModel={viewModel}
          isRemote
          userProfile={userProfile}
          status={multiplayer ? session.status : (activeSnapshot?.status || 'playing')}
          secondsRemaining={multiplayer ? session.secondsRemaining : null}
          error={multiplayer ? session.error : ''}
          canMove={canAct}
          pending={multiplayer ? session.pending : false}
          paused={showCoinToss}
          onRoll={handleRoll}
          onMove={handleMove}
          onBack={handleBack}
        />
      ) : null}

      <CoinTossModal
        visible={showCoinToss}
        players={ludoPlayers}
        gameName="Lúùdò Game"
        initialWinnerIndex={activeSnapshot?.coinToss?.winnerIndex}
        onComplete={handleCoinTossComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B113A' },
});
