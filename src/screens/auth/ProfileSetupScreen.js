import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { User, Gamepad2, Check, ArrowLeft } from 'lucide-react-native';
import GAButton from '../../components/GAButton';
import GAInput from '../../components/GAInput';
import GACard from '../../components/GACard';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const GAMES = [
  { id: 'whot', name: 'Whot', icon: '🎴' },
  { id: 'ludo', name: 'Ludo', icon: '🎲' },
  { id: 'ayo', name: 'Ayo Olopon', icon: '🪵' },
  { id: 'draughts', name: 'Draughts', icon: '🏁' },
];

export default function ProfileSetupScreen({ navigation }) {
  const { theme } = useTheme();
  const { updateProfileData } = useAuth();
  const [username, setUsername] = useState('');
  const [favGame, setFavGame] = useState('whot');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfileData({
        username: username.trim() || 'GameMaster',
        favoriteGame: favGame,
        profileCompleted: true,
      });
      navigation.replace('MainTabs');
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.bg }]}>
      {/* Top Header Navigation */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
          style={styles.backCircleBtn}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={[styles.title, { color: theme.textPrimary }]}>Complete Profile</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Pick your gamer handle & favorite game
      </Text>

      <GAInput
        label="Gamertag / Username"
        value={username}
        onChangeText={setUsername}
        placeholder="e.g. MasterGamer99"
        leftIcon={<User size={20} color={theme.textMuted} />}
      />

      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        Select Favorite Game
      </Text>

      <View style={styles.grid}>
        {GAMES.map((g) => {
          const selected = favGame === g.id;
          return (
            <TouchableOpacity
              key={g.id}
              onPress={() => setFavGame(g.id)}
              style={[
                styles.gameCard,
                {
                  backgroundColor: selected ? theme.cardBg : theme.inputBg,
                  borderColor: selected ? theme.primary : theme.inputBorder,
                },
              ]}
            >
              <Text style={styles.emoji}>{g.icon}</Text>
              <Text style={[styles.gameName, { color: theme.textPrimary }]}>{g.name}</Text>
              {selected && <Check size={18} color={theme.primary} style={styles.checkIcon} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <GAButton
        title="Continue to Arena"
        onPress={handleSave}
        loading={loading}
        style={{ marginTop: 28 }}
      />
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 10,
    zIndex: 10,
    alignItems: 'flex-start',
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 10,
    paddingBottom: 320,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gameCard: {
    width: '47%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  gameName: {
    fontSize: 14,
    fontWeight: '700',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
