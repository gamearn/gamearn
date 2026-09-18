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
  Box,
  Trophy,
  Coins,
} from 'lucide-react-native';

export default function LudoSetupScreen({ navigation }) {
  const [playerCount, setPlayerCount] = useState(4); // 2, 4
  const [tokenCount, setTokenCount] = useState(4); // 1, 2, 3, 4
  const [turnTimer, setTurnTimer] = useState('2m'); // '30s', '1m', '2m', '3m'

  const handleStartGame = () => {
    navigation.navigate('LudoGame', {
      players: playerCount,
      tokens: tokenCount,
      timer: turnTimer,
      stake: 250,
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
        <Text style={styles.headerTitle}>Lúùdò Game Set-up</Text>
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
            {[2, 4].map((num) => (
              <TouchableOpacity
                key={num}
                activeOpacity={0.85}
                onPress={() => setPlayerCount(num)}
                style={[styles.segmentBtn, playerCount === num && styles.segmentBtnActiveCyan]}
              >
                <Text style={[styles.segmentBtnText, playerCount === num && styles.segmentBtnTextActive]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Token Count */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionLabelRow}>
            <Box size={16} color="#FFB800" />
            <Text style={styles.sectionLabel}>Token Count</Text>
          </View>
          <View style={styles.segmentedRow}>
            {[1, 2, 3, 4].map((tCount) => (
              <TouchableOpacity
                key={tCount}
                activeOpacity={0.85}
                onPress={() => setTokenCount(tCount)}
                style={[styles.segmentBtn, tokenCount === tCount && styles.segmentBtnActiveYellow]}
              >
                <Text style={[styles.segmentBtnText, tokenCount === tCount && styles.segmentBtnTextActiveDark]}>
                  {tCount}
                </Text>
              </TouchableOpacity>
            ))}
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

        {/* Leaderboard Position & Entry Fee Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>LEADERBOARD POSITION</Text>
            <View style={styles.summaryValRow}>
              <Trophy size={16} color="#00E5FF" style={{ marginRight: 4 }} />
              <Text style={styles.summaryCyanVal}>3,450</Text>
            </View>
          </View>

          <View style={styles.summaryColRight}>
            <Text style={styles.summaryLabel}>ENTRY FEE</Text>
            <Text style={styles.summaryWhiteVal}>$70.00</Text>
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

        {/* GAMEARN Footer */}
        <View style={styles.brandFooter}>
          <Text style={styles.brandTitle}>
            GAME<Text style={{ color: '#FF5500' }}>ARN</Text>
          </Text>
          <Text style={styles.brandSub}>WHERE SKILL BECOMES REWARD</Text>
        </View>
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
  segmentBtnActiveCyan: {
    backgroundColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  segmentBtnActiveYellow: {
    backgroundColor: '#FFB800',
    shadowColor: '#FFB800',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  segmentBtnText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '700',
  },
  segmentBtnTextActive: {
    color: '#070C1B',
    fontWeight: '900',
  },
  segmentBtnTextActiveDark: {
    color: '#070C1B',
    fontWeight: '900',
  },
  sliderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  summaryCol: {
    alignItems: 'flex-start',
  },
  summaryColRight: {
    alignItems: 'flex-end',
  },
  summaryLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  summaryValRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCyanVal: {
    color: '#00E5FF',
    fontSize: 22,
    fontWeight: '900',
  },
  summaryWhiteVal: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
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
    marginBottom: 32,
  },
  brandFooter: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandSub: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 2,
  },
});
