import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { WhotScreen } from '../../games/whot/WhotScreen';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function WhotGameScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { userProfile, updateProfileData } = useAuth();
  const stake = route.params?.stake || 250;
  const timer = route.params?.timer || '2m';

  const handleWin = (bonusCoins) => {
    if (updateProfileData && userProfile) {
      const currentCoins = userProfile.coins || 1000;
      updateProfileData({
        coins: currentCoins + Math.floor(stake * 1.9),
        wins: (userProfile.wins || 0) + 1,
      });
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
      <View style={styles.gameArea}>
        <WhotScreen timer={timer} onWin={handleWin} />
      </View>
      <View style={[styles.topBar, { backgroundColor: 'rgba(16, 7, 93, 0.85)' }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ArrowLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Whot Championship</Text>
        <View style={styles.stakeTag}>
          <Text style={styles.stakeText}>Stake: {stake} Coins</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10075d',
    position: 'relative',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    zIndex: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 229, 255, 0.2)',
  },
  backBtn: {
    padding: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  stakeTag: {
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.4)',
  },
  stakeText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '800',
  },
  gameArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
