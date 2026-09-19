import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Trophy, BarChart2, ChevronDown } from 'lucide-react-native';
import { tournaments } from '../../services/api';

const GAME_TYPE_BY_LABEL = {
  'Dráfù (Draft)': 'draughts',
  'Lúùdò': 'ludo',
  'Ayò Ọ̀pọ́n': 'ayo',
  'Wọ́t': 'whot',
};

const DURATION_KEY_BY_LABEL = {
  '24 HOURS': '24h',
  '7 DAYS': '7d',
  '2 WEEKS': '2w',
  '1 MONTH': '1m',
};

export default function CreateTournamentScreen({ navigation }) {
  const [tourName, setTourName] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [showGamePicker, setShowGamePicker] = useState(false);
  const [duration, setDuration] = useState('7 DAYS');
  const [tourType, setTourType] = useState('Win Tournament');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [numWinners, setNumWinners] = useState('');
  const [loading, setLoading] = useState(false);

  const GAMES = ['Dráfù (Draft)', 'Lúùdò', 'Ayò Ọ̀pọ́n', 'Wọ́t'];
  const DURATIONS = [
    { label: '24', sub: 'HOURS' },
    { label: '7', sub: 'DAYS' },
    { label: '2', sub: 'WEEKS' },
    { label: '1', sub: 'MONTH' },
  ];

  const handleCreate = async () => {
    const name = tourName.trim();
    if (name.length < 2) {
      Alert.alert('Tournament Name Required', 'Please enter a name for your tournament.');
      return;
    }
    if (!selectedGame) {
      Alert.alert('Select a Game', 'Choose which game this tournament is for.');
      return;
    }
    const maxP = parseInt(maxPlayers, 10);
    const topW = parseInt(numWinners, 10);
    if (isNaN(maxP) || maxP < 2 || maxP > 256) {
      Alert.alert('Check Players', 'Maximum players must be between 2 and 256.');
      return;
    }
    if (isNaN(topW) || topW < 1 || topW > maxP) {
      Alert.alert('Check Winners', `Top winners must be between 1 and ${maxP}.`);
      return;
    }

    setLoading(true);
    try {
      await tournaments.create({
        name,
        gameType: GAME_TYPE_BY_LABEL[selectedGame],
        duration: DURATION_KEY_BY_LABEL[duration],
        tournamentType: tourType === 'Win Tournament' ? 'win' : 'plays',
        maxPlayers: maxP,
        topWinners: topW,
      });
      setLoading(false);
      Alert.alert('Tournament Submitted! 🏆', `"${name}" is pending approval. Once approved it appears in the tournament lobby.`, [
        {
          text: 'View Pending',
          onPress: () =>
            navigation.navigate('TournamentPending', {
              title: name,
              entryFee: '₦500',
              duration: duration.split(' ')[0],
            }),
        },
        { text: 'OK' },
      ]);
    } catch (err) {
      setLoading(false);
      Alert.alert('Could not create tournament', err?.message || 'Please try again.');
    }
  };

  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle="light-content" backgroundColor="#070C1B" />
      <LinearGradient colors={['#091026', '#060919', '#040612']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
          style={styles.backCircleBtn}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Tournament</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section Heading */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tournament Info</Text>
          <Text style={styles.sectionSub}>Basic Info & Game Selection</Text>
        </View>

        {/* 1. Tournament Name Input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Tournament Name</Text>
          <TextInput
            style={styles.textInput}
            value={tourName}
            onChangeText={setTourName}
            placeholder="e.g. Draft Grandmaster Championship"
            placeholderTextColor="#64748B"
          />
        </View>

        {/* 2. Select Game Dropdown */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Select Game</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowGamePicker(!showGamePicker)}
            style={styles.dropdownBox}
          >
            <Text style={[styles.dropdownText, !selectedGame && { color: '#64748B' }]}>
              {selectedGame || 'Choose a game'}
            </Text>
            <ChevronDown size={20} color="#94A3B8" />
          </TouchableOpacity>

          {showGamePicker && (
            <View style={styles.pickerDropdownMenu}>
              {GAMES.map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => {
                    setSelectedGame(g);
                    setShowGamePicker(false);
                  }}
                  style={styles.pickerMenuItem}
                >
                  <Text style={[styles.pickerMenuText, selectedGame === g && { color: '#00E5FF', fontWeight: '800' }]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 3. Duration Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Duration</Text>
          <View style={styles.durationGrid}>
            {DURATIONS.map((item) => {
              const fullLabel = `${item.label} ${item.sub}`;
              const selected = duration === fullLabel;
              return (
                <TouchableOpacity
                  key={fullLabel}
                  activeOpacity={0.8}
                  onPress={() => setDuration(fullLabel)}
                  style={[styles.durationCard, selected && styles.durationCardSelected]}
                >
                  <Text style={[styles.durationNum, selected && { color: '#00E5FF' }]}>{item.label}</Text>
                  <Text style={[styles.durationSub, selected && { color: '#00E5FF' }]}>{item.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Tournament Type */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Tournament Type</Text>
          <View style={styles.typeToggleContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setTourType('Win Tournament')}
              style={[
                styles.typeToggleBtn,
                tourType === 'Win Tournament' && styles.typeToggleActiveCyan,
              ]}
            >
              <Trophy
                size={18}
                color={tourType === 'Win Tournament' ? '#070C1B' : '#FFFFFF'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.typeToggleText,
                  tourType === 'Win Tournament' && { color: '#070C1B', fontWeight: '900' },
                ]}
              >
                Win Tournament
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setTourType('Number of Plays')}
              style={[
                styles.typeToggleBtn,
                tourType === 'Number of Plays' && styles.typeToggleActiveCyan,
              ]}
            >
              <BarChart2
                size={18}
                color={tourType === 'Number of Plays' ? '#070C1B' : '#FFFFFF'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.typeToggleText,
                  tourType === 'Number of Plays' && { color: '#070C1B', fontWeight: '900' },
                ]}
              >
                Number of Plays
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. Number of Players (Max) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Number of Players (Max)</Text>
          <TextInput
            style={styles.textInput}
            value={maxPlayers}
            onChangeText={setMaxPlayers}
            placeholder="e.g. 30, 50, 100..."
            placeholderTextColor="#64748B"
            keyboardType="numeric"
          />
        </View>

        {/* 6. Number of Winners (Top) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Number of winners (Top)</Text>
          <TextInput
            style={styles.textInput}
            value={numWinners}
            onChangeText={setNumWinners}
            placeholder="e.g. 1, 3, 5..."
            placeholderTextColor="#64748B"
            keyboardType="numeric"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleCreate}
          disabled={loading}
          style={styles.createSubmitBtn}
        >
          <Text style={styles.createSubmitText}>
            {loading ? 'Publishing...' : 'Create Tournament'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#070C1B',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  sectionSub: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
  },
  dropdownBox: {
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  pickerDropdownMenu: {
    backgroundColor: '#0F192D',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
  },
  pickerMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  pickerMenuText: {
    color: '#CBD5E1',
    fontSize: 14,
  },
  durationGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  durationCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationCardSelected: {
    borderColor: '#00E5FF',
    borderWidth: 1.5,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
  },
  durationNum: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  durationSub: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  typeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  typeToggleActiveCyan: {
    backgroundColor: '#00E5FF',
  },
  typeToggleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  createSubmitBtn: {
    backgroundColor: '#FF5500',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#FF5500',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  createSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
