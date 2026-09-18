import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Gamepad2, Coins, Swords, Settings, ArrowLeft } from 'lucide-react-native';
import BrandLogo from '../../components/BrandLogo';
import GAButton from '../../components/GAButton';
import GACard from '../../components/GACard';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const STAKES = [100, 250, 500, 1000, 2500, 5000];

export default function GameLobbyScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { userProfile } = useAuth();
  const { gameId, gameName, targetScreen } = route.params || { gameId: 'whot', gameName: 'Whot Naija', targetScreen: 'WhotGame' };

  const [selectedStake, setSelectedStake] = useState(250);
  const [isSearching, setIsSearching] = useState(false);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  const handleStartMatch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      navigation.navigate(targetScreen, { stake: selectedStake });
    }, 1500);
  };

  const handleOpenSetup = () => {
    if (gameId === 'whot') {
      navigation.navigate('WhotSetup');
    } else if (gameId === 'ludo') {
      navigation.navigate('LudoSetup');
    } else {
      navigation.navigate('WhotSetup');
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.bg }]}>
      <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
        <ArrowLeft size={24} color={theme.textPrimary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <BrandLogo size={48} variant="icon" />
        <Text style={[styles.title, { color: theme.textPrimary }]}>{gameName}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Select your stake and find an online opponent
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleOpenSetup}
        style={[styles.setupCard, { backgroundColor: 'rgba(0, 229, 255, 0.1)', borderColor: '#00E5FF' }]}
      >
        <Settings size={20} color="#00E5FF" />
        <Text style={{ color: '#00E5FF', fontWeight: '800', fontSize: 14 }}>
          ⚙️ Custom Match Setup ({gameName})
        </Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Choose Entry Stake</Text>

      <View style={styles.stakeGrid}>
        {STAKES.map((stake) => {
          const selected = selectedStake === stake;
          return (
            <TouchableOpacity
              key={stake}
              onPress={() => setSelectedStake(stake)}
              style={[
                styles.stakeCard,
                {
                  backgroundColor: selected ? theme.cardBg : theme.inputBg,
                  borderColor: selected ? theme.primary : theme.inputBorder,
                },
              ]}
            >
              <Coins size={20} color={selected ? theme.accent : theme.textMuted} />
              <Text style={[styles.stakeAmount, { color: theme.textPrimary }]}>{stake}</Text>
              <Text style={[styles.stakeLabel, { color: theme.textSecondary }]}>Coins</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <GACard style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={{ color: theme.textSecondary }}>Entry Fee:</Text>
          <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{selectedStake} Coins</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={{ color: theme.textSecondary }}>Winner Takes:</Text>
          <Text style={{ color: theme.success, fontWeight: '800' }}>{Math.floor(selectedStake * 1.9)} Coins</Text>
        </View>
      </GACard>

      <GAButton
        title={isSearching ? 'Matchmaking... Searching' : 'Find Opponent & Play'}
        onPress={handleStartMatch}
        loading={isSearching}
        icon={<Swords size={20} color="#FFF" />}
        style={{ marginTop: 24 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 65,
  },
  backBtn: {
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  setupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  stakeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  stakeCard: {
    width: '30%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    gap: 4,
  },
  stakeAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  stakeLabel: {
    fontSize: 11,
  },
  summaryCard: {
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
