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
    1: { nullRule: false, removed: false },
    2: { nullRule: false, removed: false },
    5: { nullRule: false, removed: false },
  });

  const handleStartGame = () => {
    navigation.navigate('WhotGame', {
      players: playerCount,
      option: playOption,
      cards: startingCards,
      timer: turnTimer,
    });
  };

  const toggleSpecialNull = (cardVal) => {
    setSpecialCards((prev) => ({
      ...prev,
      [cardVal]: { ...prev[cardVal], nullRule: !prev[cardVal].nullRule },
    }));
  };

  const toggleSpecialRemove = (cardVal) => {
    setSpecialCards((prev) => ({
      ...prev,
      [cardVal]: { ...prev[cardVal], removed: !prev[cardVal].removed },
    }));
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
                { width: `${((startingCards - 4) / 4) * 100}%` },
              ]}
            />
            <View style={styles.ticksRow}>
              {[4, 5, 6, 7, 8].map((val) => (
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
              <Text style={styles.sectionLabel}>Special Cards</Text>
            </View>
            <View style={styles.colHeadersRow}>
              <Text style={styles.colHeaderText}>Null</Text>
              <Text style={styles.colHeaderText}>Remove</Text>
            </View>
          </View>

          {/* Special Card Items */}
          {[
            { num: 1, name: 'Hold On' },
            { num: 2, name: 'Pick Two' },
            { num: 5, name: 'Pick Three' },
          ].map((item) => {
            const stateObj = specialCards[item.num];
            return (
              <View key={item.num} style={styles.specialRowCard}>
                <View style={styles.numBadge}>
                  <Text style={styles.numBadgeText}>{item.num}</Text>
                </View>
                <Text style={styles.specialName}>{item.name}</Text>

                <View style={styles.checkActionsRow}>
                  {/* Null Radio Circle */}
                  <TouchableOpacity
                    onPress={() => toggleSpecialNull(item.num)}
                    style={styles.checkActionTouch}
                  >
                    {stateObj.nullRule ? (
                      <CheckCircle2 size={22} color="#00E5FF" />
                    ) : (
                      <Circle size={22} color="#334155" />
                    )}
                  </TouchableOpacity>

                  {/* Remove Checkbox Square */}
                  <TouchableOpacity
                    onPress={() => toggleSpecialRemove(item.num)}
                    style={styles.checkActionTouch}
                  >
                    {stateObj.removed ? (
                      <CheckSquare size={22} color="#00E5FF" />
                    ) : (
                      <Square size={22} color="#334155" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
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
  colHeadersRow: {
    flexDirection: 'row',
    gap: 20,
    paddingRight: 8,
  },
  colHeaderText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
    width: 44,
    textAlign: 'center',
  },
  specialRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  numBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  numBadgeText: {
    color: '#00E5FF',
    fontSize: 16,
    fontWeight: '900',
  },
  specialName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  checkActionsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  checkActionTouch: {
    width: 44,
    alignItems: 'center',
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
