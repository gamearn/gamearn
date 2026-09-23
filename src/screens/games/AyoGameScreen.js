import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { AyoScreen } from '../../games/ayo/AyoScreen';
import { useAuth } from '../../context/AuthContext';
import { useOnlineMatch } from '../../games/useOnlineMatch';

const STATUS_TEXT = {
  idle: '',
  joining: 'Joining roomâ€¦',
  waiting: 'Waiting for opponentâ€¦',
  playing: 'Live match',
  game_over: 'Match over',
  aborted: 'Match cancelled',
  error: 'Connection error',
};

export default function AyoGameScreen({ route, navigation }) {
  const { userProfile } = useAuth();
  const params = route.params || {};
  const isMultiplayer = params.mode === 'multiplayer' && !!params.roomId;
  const isPractice = params.mode === 'practice';
  const timer = params.timer || '2m';

  const m = useOnlineMatch({
    roomId: isMultiplayer ? params.roomId : null,
    gameType: 'ayo',
    onExit: () => navigation.goBack(),
  });

  const [winBanner, setWinBanner] = useState(false);

  const handleHumanMove = (pitIndex) => {
    if (isMultiplayer && typeof pitIndex === 'number') {
      m.sendMove({ pitIndex });
    }
  };

  const handleWin = () => {
    if (!isMultiplayer) {
      setWinBanner(true);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  return (
    <View style={styles.container}>
      {isPractice ? (
        <View style={styles.practiceBanner}>
          <Text style={styles.practiceBannerText}>Practice for AyÃ² rolls out with Whot first</Text>
        </View>
      ) : null}
      {isMultiplayer ? (
        <View style={styles.liveBar}>
          <Text style={styles.liveTitle}>AyÃ² á»ŒÌ€pá»Ìn â€” Live</Text>
          <Text style={styles.liveOpp}>{m.opponent?.displayName || 'Live opponent'}</Text>
          <Text style={styles.liveStatus}>{STATUS_TEXT[m.status] || m.status}</Text>
          {m.banner ? <Text style={styles.liveBanner}>{m.banner}</Text> : null}
        </View>
      ) : null}
      {winBanner && !isMultiplayer ? (
        <View style={styles.winBanner}>
          <Text style={styles.winBannerText}>You win!</Text>
        </View>
      ) : null}
      <AyoScreen
        timer={timer}
        aiDifficulty={params.aiDifficulty}
        onWin={handleWin}
        onBack={handleBack}
        onHumanMove={handleHumanMove}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#03271d',
  },
  practiceBanner: {
    alignSelf: 'center',
    marginTop: 4,
    marginHorizontal: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  practiceBannerText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  liveBar: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    marginHorizontal: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00E5FF',
    backgroundColor: '#10075d',
  },
  liveTitle: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '900',
  },
  liveOpp: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  liveStatus: {
    color: '#7DD3FC',
    fontSize: 11,
    fontWeight: '600',
  },
  liveBanner: {
    color: '#FDE047',
    fontSize: 11,
    fontWeight: '700',
    width: '100%',
  },
  winBanner: {
    alignSelf: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
  },
  winBannerText: {
    color: '#6EE7B7',
    fontSize: 13,
    fontWeight: '900',
  },
});
