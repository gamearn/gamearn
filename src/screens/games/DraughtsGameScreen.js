import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CheckersScreen } from '../../games/checkers/CheckersScreen';
import { useAuth } from '../../context/AuthContext';

export default function DraughtsGameScreen({ route, navigation }) {
  const { userProfile, updateProfileData } = useAuth();
  const stake = route.params?.stake || 250;
  const timer = route.params?.timer || '2m';

  const handleWin = (winStake) => {
    if (updateProfileData && userProfile) {
      updateProfileData({
        coins: (userProfile.coins || 1000) + Math.floor(winStake * 1.9),
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
      <CheckersScreen
        stake={stake}
        timer={timer}
        onWin={handleWin}
        onBack={handleBack}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#061019',
  },
});
