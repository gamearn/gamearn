import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AyoScreen } from '../../games/ayo/AyoScreen';
import { useAuth } from '../../context/AuthContext';

export default function AyoGameScreen({ route, navigation }) {
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
      <AyoScreen timer={timer} onWin={handleWin} onBack={handleBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#03271d',
  },
});
