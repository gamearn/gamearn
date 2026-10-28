import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Users,
  Layers,
  Clock,
  Star,
  CheckCircle2,
  Circle,
  Square,
  CheckSquare,
  Play,
} from 'lucide-react-native';

export default function WhotSetupScreen({ navigation }) {
  const [playerCount, setPlayerCount] = useState(3); // 2, 3, 4, 5
  const [playOption, setPlayOption] = useState('continuous'); // 'continuous', 'finish'
  const [startingCards, setStartingCards] = useState(6); // 4..8
  const [turnTimer, setTurnTimer] = useState('2m'); // '30s', '1m', '2m', '3m'
  const [specialCards, setSpecialCards] = useState({
    1: true,
    2: true,
    5: true,
    8: true,
    14: true,
    20: true,
  });

  const toggleSpecialCard = (cardVal) => {
    setSpecialCards((prev) => ({
      ...prev,
      [cardVal]: !prev[cardVal],
    }));
  };

  const handleStartGame = () => {
    const nulled = [1, 2, 5, 8, 14]
      .filter((num) => specialCards[num] === false)
      .map(String);
    const removed = specialCards[20] === false ? ['20'] : [];

    navigation.navigate('WhotGame', {
      players: playerCount,
      playerCount: playerCount,
      option: playOption,
      cards: startingCards,
      cardCount: startingCards,
      startCards: startingCards,
      startingCards: startingCards,
      timer: turnTimer,
      specialCards,
      nulled,
      removed,
      resetKey: Date.now(),
    });
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
        <Text style={styles.headerTitle}>Wọt Game Set-up</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleHead}>
          <Text style={styles.mainTitle}>Game Setup</Text>
          <Text style={styles.subTitle}>Configure your match settings</Text>
        </View>

        {/* Players Selection */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionLabelRow}>
            <Users size={16} color="#00E5FF" />
            <Text style={styles.sectionLabel}>Players Selection</Text>
          </View>
          <View style={styles.segmentedRow}>
            {[2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                activeOpacity={0.85}
                onPress={() => setPlayerCount(num)}
                style={[styles.segmentBtn, playerCount === num && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentBtnText, playerCount === num && styles.segmentBtnTextActive]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Play Options */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionLabelRow}>
            <Layers size={16} color="#00E5FF" />
            <Text style={styles.sectionLabel}>Play Options</Text>
          </View>
          <View style={styles.segmentedRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setPlayOption('continuous')}
              style={[styles.segmentBtn, playOption === 'continuous' && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentBtnText, playOption === 'continuous' && styles.segmentBtnTextActive]}>
                Continuous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setPlayOption('finish')}
              style={[styles.segmentBtn, playOption === 'finish' && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentBtnText, playOption === 'finish' && styles.segmentBtnTextActive]}>
                Finish and count
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Starting Cards Slider */}
        <View style={styles.sectionWrap}>
          <View style={styles.sliderHeaderRow}>
            <View style={styles.sectionLabelRow}>
              <Layers size={16} color="#00E5FF" />
              <Text style={styles.sectionLabel}>Starting Cards</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.sliderSubLabel}>Cards per player </Text>
              <Text style={styles.sliderValText}>{startingCards}</Text>
            </View>
          </View>

          {/* Slider Step Track */}
          <View style={styles.sliderTrackWrap}>
            <View style={styles.sliderTrackLine} />
            <View
              style={[
                styles.sliderTrackFill,
                { width: `${((startingCards - 3) / 5) * 100}%` },
              ]}
            />
            <View style={styles.ticksRow}>
              {[3, 4, 5, 6, 7, 8].map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setStartingCards(val)}
                  style={styles.tickItem}
                >
                  <View
                    style={[
                      styles.tickKnob,
                      startingCards === val && styles.tickKnobActive,
                    ]}
                  />
                  <Text style={[styles.tickText, startingCards === val && styles.tickTextActive]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Turn Timer Slider */}
        <View style={styles.sectionWrap}>
          <View style={styles.sliderHeaderRow}>
            <Text style={styles.sectionLabel}>Turn Timer</Text>
            <Text style={styles.sliderValText}>{turnTimer}</Text>
          </View>

          {/* Slider Step Track */}
          <View style={styles.sliderTrackWrap}>
            <View style={styles.sliderTrackLine} />
            <View
              style={[
                styles.sliderTrackFill,
                {
                  width: `${
                    turnTimer === '30s'
                      ? 0
                      : turnTimer === '1m'
                      ? 33
                      : turnTimer === '2m'
                      ? 66
                      : 100
                  }%`,
                },
              ]}
            />
            <View style={styles.ticksRow}>
              {['30s', '1m', '2m', '3m'].map((tVal) => (
                <TouchableOpacity
                  key={tVal}
                  onPress={() => setTurnTimer(tVal)}
                  style={styles.tickItem}
                >
                  <View
                    style={[
                      styles.tickKnob,
                      turnTimer === tVal && styles.tickKnobActive,
                    ]}
                  />
                  <Text style={[styles.tickText, turnTimer === tVal && styles.tickTextActive]}>
                    {tVal}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Special Cards Section */}
        <View style={styles.sectionWrap}>
          <View style={styles.specialHeaderRow}>
            <View style={styles.sectionLabelRow}>
              <Star size={16} color="#FF5500" />
              <Text style={styles.sectionLabel}>Special Cards Rules</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setSpecialCards({ 1: true, 2: true, 5: true, 8: true, 14: true, 20: true })}
                style={styles.quickToggleBtn}
              >
                <Text style={styles.quickToggleText}>All ON</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSpecialCards({ 1: false, 2: false, 5: false, 8: false, 14: false, 20: false })}
                style={styles.quickToggleBtn}
              >
                <Text style={styles.quickToggleText}>All OFF</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.specialHelpText}>
            Turn any special card ON or OFF. Turning off a number makes it a normal card with no penalty (e.g. 2 has no pick 2). Turning off Whot 20 removes it entirely from the game for both players and Oba.
          </Text>

          {/* Tabulated Special Card Rules */}
          <View style={styles.tableWrap}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableColHeader, { width: 68 }]}>CARD #</Text>
              <Text style={[styles.tableColHeader, { flex: 1, paddingHorizontal: 6 }]}>SPECIAL RULE</Text>
              <Text style={[styles.tableColHeader, { width: 104, textAlign: 'center' }]}>CONTROL</Text>
            </View>

            {[
              { num: 1, name: 'Hold On', desc: 'Player plays again immediately' },
              { num: 2, name: 'Pick Two', desc: 'Next player draws 2 cards' },
              { num: 5, name: 'Pick Three', desc: 'Next player draws 3 cards' },
              { num: 8, name: 'Suspension', desc: 'Next player skips their turn' },
              { num: 14, name: 'General Market', desc: 'All opponents draw 1 card' },
              { num: 20, name: 'Whot 20 (Wildcard)', desc: 'Call shape (OFF removes 20 from game)' },
            ].map((item, idx, arr) => {
              const isEnabled = specialCards[item.num] !== false;
              const isLast = idx === arr.length - 1;
              return (
                <View
                  key={item.num}
                  style={[
                    styles.tableRow,
                    isLast && { borderBottomWidth: 0 },
                    !isEnabled && { backgroundColor: 'rgba(239, 68, 68, 0.04)' },
                  ]}
                >
                  <View style={{ width: 68, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.tableCardBadge, !isEnabled && styles.tableCardBadgeDisabled]}>
                      <Text style={[styles.tableCardBadgeText, !isEnabled && { color: '#64748B' }]}>
                        {item.num}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flex: 1, paddingHorizontal: 6 }}>
                    <Text style={[styles.tableCardName, !isEnabled && { color: '#94A3B8' }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.tableCardDesc, !isEnabled && { color: '#EF4444' }]}>
                      {isEnabled
                        ? item.desc
                        : item.num === 20
                        ? '🚫 Removed from deck for both players and Oba'
                        : '⚪ Normal card · No special effect'}
                    </Text>
                  </View>

                  <View style={{ width: 104, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <View style={styles.toggleSegmentContainer}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setSpecialCards((prev) => ({ ...prev, [item.num]: true }))}
                        style={[
                          styles.toggleSegmentBtn,
                          isEnabled && styles.toggleSegmentBtnOn,
                        ]}
                      >
                        <Text style={[styles.toggleSegmentText, isEnabled && styles.toggleSegmentTextActive]}>
                          ON
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setSpecialCards((prev) => ({ ...prev, [item.num]: false }))}
                        style={[
                          styles.toggleSegmentBtn,
                          !isEnabled && styles.toggleSegmentBtnOff,
                        ]}
                      >
                        <Text style={[styles.toggleSegmentText, !isEnabled && styles.toggleSegmentTextActive]}>
                          OFF
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Start Game CTA */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleStartGame}
          style={styles.primaryOrangeBtn}
        >
          <Text style={styles.primaryOrangeBtnText}>START GAME ▷</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimerText}>
          By starting, you agree to the Game Rules and Terms of Service.
        </Text>
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
    paddingBottom: 40,
  },
  titleHead: {
    marginBottom: 20,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  subTitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  sectionWrap: {
    marginBottom: 24,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 25, 45, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  segmentBtnActive: {
    backgroundColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  segmentBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  segmentBtnTextActive: {
    color: '#070C1B',
    fontWeight: '900',
  },
  sliderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sliderSubLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  sliderValText: {
    color: '#00E5FF',
    fontSize: 16,
    fontWeight: '900',
  },
  sliderTrackWrap: {
    height: 50,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrackLine: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    position: 'absolute',
    left: 10,
    right: 10,
  },
  sliderTrackFill: {
    height: 4,
    backgroundColor: '#00E5FF',
    borderRadius: 2,
    position: 'absolute',
    left: 10,
  },
  ticksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  tickItem: {
    alignItems: 'center',
    width: 40,
  },
  tickKnob: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#334155',
    borderWidth: 2,
    borderColor: '#070C1B',
    marginBottom: 6,
  },
  tickKnobActive: {
    backgroundColor: '#00E5FF',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderColor: '#070C1B',
    borderWidth: 3,
  },
  tickText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  tickTextActive: {
    color: '#00E5FF',
    fontWeight: '900',
  },
  specialHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  specialHelpText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  quickToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  quickToggleText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '800',
  },
  tableWrap: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    marginBottom: 10,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0, 229, 255, 0.2)',
  },
  tableColHeader: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  tableCardBadge: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCardBadgeDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tableCardBadgeText: {
    color: '#00E5FF',
    fontSize: 16,
    fontWeight: '900',
  },
  tableCardName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  tableCardDesc: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  toggleSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleSegmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  toggleSegmentBtnOn: {
    backgroundColor: '#10B981',
  },
  toggleSegmentBtnOff: {
    backgroundColor: '#EF4444',
  },
  toggleSegmentText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
  },
  toggleSegmentTextActive: {
    color: '#FFFFFF',
  },
  primaryOrangeBtn: {
    backgroundColor: '#FF5500',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5500',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginTop: 10,
    marginBottom: 12,
  },
  primaryOrangeBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  disclaimerText: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
  },
});
