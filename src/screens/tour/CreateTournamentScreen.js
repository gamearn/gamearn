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
  Modal,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Trophy,
  BarChart2,
  ChevronDown,
  ShieldAlert,
  Coins,
  CheckCircle,
  ExternalLink,
  X,
  AlertTriangle,
  Zap,
} from 'lucide-react-native';
import { tournaments } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const GAME_TYPE_BY_LABEL = {
  'All Games': 'all',
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

const WINNER_OPTIONS = [1, 3, 5, 10];
const ENTRY_FEE_PRESETS = [0, 5, 10, 20, 50];
const COMMIT_VP_PRESETS = [50, 100, 200, 500];

export default function CreateTournamentScreen({ navigation }) {
  const { userProfile, refreshProfile, refreshWallet } = useAuth();

  const [tourName, setTourName] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [showGamePicker, setShowGamePicker] = useState(false);
  const [duration, setDuration] = useState('7 DAYS');
  const [customDays, setCustomDays] = useState('7');
  const [tourType, setTourType] = useState('Win Tournament');
  const [maxPlayers, setMaxPlayers] = useState('32');
  const [topWinners, setTopWinners] = useState(3);
  const [customWinners, setCustomWinners] = useState('3');
  const [entryFee, setEntryFee] = useState('10');
  const [committedVp, setCommittedVp] = useState('100');

  const [showCommitModal, setShowCommitModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // User's acquired Value Points balance
  const userVp = userProfile?.valuePoints ?? userProfile?.vp ?? 0;

  const GAMES = ['All Games', 'Dráfù (Draft)', 'Lúùdò', 'Ayò Ọ̀pọ́n', 'Wọ́t'];
  const DURATIONS = [
    { label: '24', sub: 'HOURS' },
    { label: '7', sub: 'DAYS' },
    { label: '2', sub: 'WEEKS' },
    { label: '1', sub: 'MONTH' },
  ];

  const handleCustomDaysChange = (text) => {
    const cleanNum = text.replace(/[^0-9]/g, '');
    setCustomDays(cleanNum);
    if (cleanNum && parseInt(cleanNum, 10) > 0) {
      const days = parseInt(cleanNum, 10);
      setDuration(`${days} DAYS`);
    }
  };

  const handlePresetSelect = (item) => {
    const fullLabel = `${item.label} ${item.sub}`;
    setDuration(fullLabel);
    if (item.sub === 'HOURS') setCustomDays('1');
    else if (item.sub === 'DAYS') setCustomDays(item.label);
    else if (item.sub === 'WEEKS') setCustomDays(String(parseInt(item.label, 10) * 7));
    else if (item.sub === 'MONTH') setCustomDays(String(parseInt(item.label, 10) * 30));
  };

  const handleWinnerSelect = (count) => {
    setTopWinners(count);
    setCustomWinners(String(count));
  };

  const handleCustomWinnersChange = (text) => {
    const cleanNum = text.replace(/[^0-9]/g, '');
    setCustomWinners(cleanNum);
    const parsed = parseInt(cleanNum, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
      setTopWinners(parsed);
    }
  };

  /**
   * Only show the payment modal when ALL details are completely filled and valid.
   */
  const handleValidateAndProceed = () => {
    const name = tourName.trim();
    if (name.length < 2) {
      Alert.alert('Tournament Name Required', 'Please enter a name for your tournament.');
      return;
    }
    if (!selectedGame) {
      Alert.alert('Select a Game', 'Please choose which game this tournament is for.');
      return;
    }

    let finalDuration = '7d';
    const parsedDays = parseInt(customDays, 10);
    if (!isNaN(parsedDays) && parsedDays > 0) {
      finalDuration = `${parsedDays}d`;
    } else if (DURATION_KEY_BY_LABEL[duration]) {
      finalDuration = DURATION_KEY_BY_LABEL[duration];
    } else {
      Alert.alert('Duration Required', 'Please enter the number of days for the tournament duration.');
      return;
    }

    const maxP = parseInt(maxPlayers, 10);
    if (isNaN(maxP) || maxP < 2) {
      Alert.alert(
        'Invalid Player Count 👥',
        'Number of players must be from 2 to ∞ (infinity) players.'
      );
      return;
    }

    const winnersCount = parseInt(customWinners, 10) || topWinners;
    if (isNaN(winnersCount) || winnersCount < 1 || winnersCount > 10) {
      Alert.alert(
        'Number of Winners',
        'Please select or enter between 1 and 10 winners (Top 1, Top 3, Top 5, Top 10).'
      );
      return;
    }

    const parsedEntryFee = parseInt(entryFee, 10);
    if (isNaN(parsedEntryFee) || parsedEntryFee < 0) {
      Alert.alert('Entry Fee Required', 'Please enter a valid entry fee in Value Points (or 0 for free).');
      return;
    }

    const parsedCommitted = parseInt(committedVp, 10);
    if (isNaN(parsedCommitted) || parsedCommitted < 1) {
      Alert.alert('Committed Value Points Required', 'Please enter the Value Points you wish to commit (e.g. 100 VP).');
      return;
    }

    // All details are completely filled! Now pop up the payment collection modal
    setShowCommitModal(true);
  };

  /**
   * User confirms commitment in the modal
   */
  const handleConfirmCreation = async () => {
    const name = tourName.trim();
    const maxP = parseInt(maxPlayers, 10);
    const winnersCount = parseInt(customWinners, 10) || topWinners;
    const parsedEntryFee = parseInt(entryFee, 10) || 0;
    const parsedCommitted = parseInt(committedVp, 10) || 100;

    let finalDuration = '7d';
    const parsedDays = parseInt(customDays, 10);
    if (!isNaN(parsedDays) && parsedDays > 0) {
      finalDuration = `${parsedDays}d`;
    } else if (DURATION_KEY_BY_LABEL[duration]) {
      finalDuration = DURATION_KEY_BY_LABEL[duration];
    }

    setLoading(true);
    try {
      const res = await tournaments.create({
        name,
        gameType: GAME_TYPE_BY_LABEL[selectedGame] || 'all',
        duration: finalDuration,
        tournamentType: tourType === 'Win Tournament' ? 'win' : 'plays',
        maxPlayers: maxP,
        topWinners: winnersCount,
        entryFeeVp: parsedEntryFee,
        committedVp: parsedCommitted,
      });

      if (refreshWallet) await refreshWallet();
      if (refreshProfile) await refreshProfile();

      setLoading(false);
      setShowCommitModal(false);

      Alert.alert(
        'Tournament Created! 🏆',
        `"${name}" is now published. It will go live once accumulated points reach 200% (${parsedCommitted * 2} VP) within 24 hours.`,
        [
          {
            text: 'View Pending Tournament',
            onPress: () => {
              if (res?.data?.id || res?.id) {
                navigation.navigate('TournamentPending', {
                  tourId: res?.data?.id || res?.id,
                  title: name,
                  entryFee: `${parsedEntryFee} VP`,
                  duration: `${parsedDays || 7} DAYS`,
                });
              } else {
                if (navigation.canGoBack()) navigation.goBack();
                navigation.navigate('MainTabs', { screen: 'TourTab' });
              }
            },
          },
        ]
      );
    } catch (err) {
      setLoading(false);
      Alert.alert('Could not create tournament', err?.message || 'Please check your Value Points balance and try again.');
    }
  };

  const handleOpenGetVpWebsite = async () => {
    const url = 'https://www.gamearn.app';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch (e) {
      Alert.alert('Website Link', 'Please visit https://www.gamearn.app to acquire Value Points.');
    }
  };

  const committedNum = parseInt(committedVp, 10) || 0;
  const hasEnoughVp = userVp >= committedNum;

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
        <View style={styles.vpBadgeSmall}>
          <Text style={styles.vpBadgeSmallText}>{userVp} VP</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section Heading */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tournament Info</Text>
          <Text style={styles.sectionSub}>Configure rules, prize parameters & risk commitment</Text>
        </View>

        {/* 1. Tournament Name Input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Tournament Name</Text>
          <TextInput
            style={styles.textInput}
            value={tourName}
            onChangeText={setTourName}
            placeholder="e.g. Lagos Draft Championship"
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
          <Text style={styles.fieldLabel}>Duration (Days)</Text>
          <View style={styles.customDaysInputContainer}>
            <TextInput
              style={styles.customDaysInput}
              value={customDays}
              onChangeText={handleCustomDaysChange}
              placeholder="e.g. 1, 3, 7, 14, 30"
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
              maxLength={4}
            />
            <View style={styles.customDaysBadge}>
              <Text style={styles.customDaysBadgeText}>DAYS</Text>
            </View>
          </View>

          <Text style={styles.subHint}>Or choose a quick preset:</Text>
          <View style={styles.durationGrid}>
            {DURATIONS.map((item) => {
              const fullLabel = `${item.label} ${item.sub}`;
              const selected = duration === fullLabel;
              return (
                <TouchableOpacity
                  key={fullLabel}
                  activeOpacity={0.8}
                  onPress={() => handlePresetSelect(item)}
                  style={[styles.durationCard, selected && styles.durationCardSelected]}
                >
                  <Text style={[styles.durationNum, selected && { color: '#00E5FF' }]}>{item.label}</Text>
                  <Text style={[styles.durationSub, selected && { color: '#00E5FF' }]}>{item.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Tournament Type / Winner Criteria */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Criteria for Determining Winners</Text>
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
                Highest Games Won
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
                Highest Games Played
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.typeHint}>
            {tourType === 'Win Tournament'
              ? 'Ranks entrants by total matches won in this game during the tournament.'
              : 'Ranks entrants by total games played across all matches during the tournament.'}
          </Text>
        </View>

        {/* 5. Number of Players (Max) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Number of Players (2 to ∞)</Text>
          <TextInput
            style={styles.textInput}
            value={maxPlayers}
            onChangeText={setMaxPlayers}
            placeholder="e.g. 16, 32, 64, 100, 1000..."
            placeholderTextColor="#64748B"
            keyboardType="numeric"
          />
        </View>

        {/* 6. Number of Winners to Reward (Max 10) */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRowWithTag}>
            <Text style={styles.fieldLabel}>Number of Winners to Reward</Text>
            <Text style={styles.limitBadge}>MAX 10</Text>
          </View>
          <Text style={styles.subHint}>Select how many top participants receive progressive rewards:</Text>

          <View style={styles.optionsRow}>
            {WINNER_OPTIONS.map((count) => {
              const isSelected = topWinners === count && customWinners === String(count);
              return (
                <TouchableOpacity
                  key={count}
                  onPress={() => handleWinnerSelect(count)}
                  style={[styles.pillOption, isSelected && styles.pillOptionSelected]}
                >
                  <Text style={[styles.pillOptionText, isSelected && styles.pillOptionTextSelected]}>
                    Top {count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.customInputRow}>
            <Text style={styles.customInputPrefix}>Or custom count (1-10):</Text>
            <TextInput
              style={styles.customWinnersInput}
              value={customWinners}
              onChangeText={handleCustomWinnersChange}
              placeholder="1 - 10"
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
        </View>

        {/* 7. Entry Fee in Value Points */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Cost of Joining (Value Points)</Text>
          <Text style={styles.subHint}>How much each participant commits to enter this tournament:</Text>
          <View style={styles.optionsRow}>
            {ENTRY_FEE_PRESETS.map((fee) => {
              const isSelected = entryFee === String(fee);
              return (
                <TouchableOpacity
                  key={fee}
                  onPress={() => setEntryFee(String(fee))}
                  style={[styles.pillOption, isSelected && styles.pillOptionSelected]}
                >
                  <Text style={[styles.pillOptionText, isSelected && styles.pillOptionTextSelected]}>
                    {fee === 0 ? 'Free' : `${fee} VP`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            style={[styles.textInput, { marginTop: 10 }]}
            value={entryFee}
            onChangeText={(t) => setEntryFee(t.replace(/[^0-9]/g, ''))}
            placeholder="Custom Entry Fee in VP"
            placeholderTextColor="#64748B"
            keyboardType="number-pad"
          />
        </View>

        {/* 8. Committed Value Points (Creator Risk) */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRowWithTag}>
            <Text style={styles.fieldLabel}>Committed Value Points (Creator Risk)</Text>
            <View style={styles.riskTag}>
              <Text style={styles.riskTagText}>50% 24h Risk</Text>
            </View>
          </View>
          <Text style={styles.subHint}>Initial Value Points you commit to launch this tournament:</Text>

          <View style={styles.optionsRow}>
            {COMMIT_VP_PRESETS.map((c) => {
              const isSelected = committedVp === String(c);
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCommittedVp(String(c))}
                  style={[styles.pillOption, isSelected && styles.pillOptionSelected]}
                >
                  <Text style={[styles.pillOptionText, isSelected && styles.pillOptionTextSelected]}>
                    {c} VP
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={[styles.textInput, { marginTop: 10 }]}
            value={committedVp}
            onChangeText={(t) => setCommittedVp(t.replace(/[^0-9]/g, ''))}
            placeholder="Custom Committed VP (e.g. 100)"
            placeholderTextColor="#64748B"
            keyboardType="number-pad"
          />

          {/* Risk info box */}
          <View style={styles.riskInfoCard}>
            <ShieldAlert size={18} color="#F59E0B" style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={styles.riskInfoText}>
              If this tournament does not go live within 24 hours, you will lose 50% of your committed value points ({Math.floor((parseInt(committedVp, 10) || 100) / 2)} VP) to the system, and 50% will be refunded to you. Participants receive a 100% refund.
            </Text>
          </View>
        </View>

        {/* Create Tournament Button - Opens Modal */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleValidateAndProceed}
          style={styles.createSubmitBtn}
        >
          <Text style={styles.createSubmitText}>Create Tournament</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ================================================================ */}
      {/* PAYMENT & COMMITMENT MODAL (ONLY SHOWS AFTER ALL DETAILS FILLED) */}
      {/* ================================================================ */}
      <Modal
        visible={showCommitModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCommitModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#101C38', '#0A1224']}
              style={styles.modalGradient}
            >
              {/* Modal Header */}
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalHeaderTitleWrap}>
                  <Coins size={22} color="#00E5FF" style={{ marginRight: 8 }} />
                  <Text style={styles.modalTitle}>Value Points Commitment</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowCommitModal(false)}
                  style={styles.modalCloseBtn}
                >
                  <X size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Tournament Summary Card */}
              <View style={styles.modalSummaryCard}>
                <Text style={styles.modalSummaryTourName} numberOfLines={1}>
                  {tourName || 'Tournament'}
                </Text>
                <Text style={styles.modalSummaryTourSub}>
                  {selectedGame} · {duration} · Top {topWinners} Winner{topWinners > 1 ? 's' : ''}
                </Text>

                <View style={styles.modalDivider} />

                <View style={styles.modalStatsRow}>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>Committed VP</Text>
                    <Text style={styles.modalStatValCyan}>{committedNum} VP</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>Entry Fee</Text>
                    <Text style={styles.modalStatValWhite}>{entryFee || 0} VP</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>Your Acquired VP</Text>
                    <Text style={[styles.modalStatValBold, hasEnoughVp ? { color: '#10B981' } : { color: '#EF4444' }]}>
                      {userVp} VP
                    </Text>
                  </View>
                </View>
              </View>

              {/* Sharing Formula Explanations */}
              <View style={styles.formulaBox}>
                <Text style={styles.formulaTitle}>Sharing Formula When Live (200%):</Text>
                <View style={styles.formulaBullet}>
                  <Zap size={14} color="#00E5FF" style={{ marginRight: 6, marginTop: 2 }} />
                  <Text style={styles.formulaBulletText}>
                    <Text style={{ color: '#00E5FF', fontWeight: '800' }}>50% to Creator: </Text>
                    You receive 50% of all accumulated value points & future entry fees.
                  </Text>
                </View>
                <View style={styles.formulaBullet}>
                  <Trophy size={14} color="#F59E0B" style={{ marginRight: 6, marginTop: 2 }} />
                  <Text style={styles.formulaBulletText}>
                    <Text style={{ color: '#F59E0B', fontWeight: '800' }}>25% Progressive Reward Pool: </Text>
                    Distributed strictly progressive to top {topWinners} winners.
                  </Text>
                </View>
                <View style={styles.formulaBullet}>
                  <CheckCircle size={14} color="#94A3B8" style={{ marginRight: 6, marginTop: 2 }} />
                  <Text style={styles.formulaBulletText}>
                    <Text style={{ color: '#CBD5E1', fontWeight: '800' }}>25% System: </Text>
                    Retained for network match operations.
                  </Text>
                </View>
              </View>

              {/* Status & Action Buttons */}
              {hasEnoughVp ? (
                <View style={styles.actionWrap}>
                  <View style={styles.readyNoteWrap}>
                    <CheckCircle size={16} color="#10B981" style={{ marginRight: 6 }} />
                    <Text style={styles.readyNoteText}>
                      You have enough points ({userVp} VP). Ready to commit {committedNum} VP.
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleConfirmCreation}
                    disabled={loading}
                    style={styles.confirmCommitBtn}
                  >
                    {loading ? (
                      <ActivityIndicator color="#070C1B" />
                    ) : (
                      <Text style={styles.confirmCommitText}>
                        Confirm & Commit {committedNum} VP
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.actionWrap}>
                  {/* Insufficient VP Warning */}
                  <View style={styles.insufficientCard}>
                    <AlertTriangle size={20} color="#EF4444" style={{ marginRight: 8, marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.insufficientTitle}>Insufficient Value Points</Text>
                      <Text style={styles.insufficientText}>
                        You need {committedNum} VP to create this tournament, but you currently have {userVp} VP.
                      </Text>
                    </View>
                  </View>

                  {/* Get Value Point / Get VP Button */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleOpenGetVpWebsite}
                    style={styles.getVpBtn}
                  >
                    <ExternalLink size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.getVpBtnText}>Get Value Point (Get VP)</Text>
                  </TouchableOpacity>

                  <Text style={styles.getVpSubtext}>
                    Clicking opens www.gamearn.app to acquire Value Points
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>
        </View>
      </Modal>
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
    fontSize: 20,
    fontWeight: '800',
  },
  vpBadgeSmall: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#00E5FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  vpBadgeSmallText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '900',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 220,
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
    marginBottom: 6,
  },
  labelRowWithTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  limitBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  riskTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  riskTagText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '900',
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
  customDaysInputContainer: {
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  customDaysInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 2,
  },
  customDaysBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  customDaysBadgeText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '900',
  },
  subHint: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 8,
    marginTop: 2,
  },
  durationGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  durationCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingVertical: 14,
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
    fontSize: 20,
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
    fontSize: 12,
    fontWeight: '700',
  },
  typeHint: {
    color: '#8AA0B4',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillOption: {
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  pillOptionSelected: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
  },
  pillOptionText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  pillOptionTextSelected: {
    color: '#00E5FF',
    fontWeight: '900',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  customInputPrefix: {
    color: '#94A3B8',
    fontSize: 13,
  },
  customWinnersInput: {
    width: 80,
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 6,
  },
  riskInfoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  riskInfoText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
  },
  createSubmitBtn: {
    backgroundColor: '#FF5500',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
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

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  modalGradient: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 40,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSummaryCard: {
    backgroundColor: 'rgba(15, 25, 45, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  modalSummaryTourName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  modalSummaryTourSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 12,
  },
  modalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalStatValCyan: {
    color: '#00E5FF',
    fontSize: 16,
    fontWeight: '900',
  },
  modalStatValWhite: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  modalStatValBold: {
    fontSize: 16,
    fontWeight: '900',
  },
  formulaBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  formulaTitle: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formulaBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  formulaBulletText: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
  actionWrap: {
    marginTop: 6,
  },
  readyNoteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  readyNoteText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  confirmCommitBtn: {
    backgroundColor: '#00E5FF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmCommitText: {
    color: '#070C1B',
    fontSize: 16,
    fontWeight: '900',
  },
  insufficientCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  insufficientTitle: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  insufficientText: {
    color: '#FECACA',
    fontSize: 12,
    lineHeight: 17,
  },
  getVpBtn: {
    backgroundColor: '#FF5500',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5500',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  getVpBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  getVpSubtext: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
});
