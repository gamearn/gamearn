import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G } from 'react-native-svg';
import {
  ArrowLeft,
  Zap,
  CheckCircle2,
  Swords,
  Trophy,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export default function TournamentDetailsScreen({ route, navigation }) {
  const { userProfile, updateProfileData } = useAuth();
  const tourTitle = route.params?.title || 'Draft Grandmaster Championship';
  const entryFee = route.params?.entryFee || 500;

  const [joined, setJoined] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(23 * 3600 + 45 * 60 + 12);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const handleJoinTournament = () => {
    if (joined) {
      navigation.navigate('DraughtsGame');
      return;
    }

    const currentCoins = userProfile?.coins ?? 1000;
    if (currentCoins < entryFee) {
      Alert.alert('Insufficient Coins', `You need ${entryFee} Coins to enter this tournament.`);
      return;
    }

    if (updateProfileData && userProfile) {
      updateProfileData({ coins: currentCoins - entryFee });
    }

    setJoined(true);
    Alert.alert('Tournament Registration Confirmed 🏆', 'You have successfully joined the Draft Grandmaster Championship.', [
      {
        text: 'Enter Game Lobby',
        onPress: () => navigation.navigate('DraughtsGame'),
      },
      { text: 'OK' },
    ]);
  };

  // Circular Chart calculations
  const size = 200;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = 0.75; // 75% filled
  const strokeDashoffset = circumference - circumference * percentage;

  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle="light-content" backgroundColor="#070C1B" />
      <LinearGradient colors={['#091026', '#060919', '#040612']} style={StyleSheet.absoluteFillObject} />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
          style={styles.backCircleBtn}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tournament Created</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Tournament Hero Card */}
        <View style={styles.heroCard}>
          {/* Banner Image */}
          <Image
            source={require('../../../assets/games/draughts_3d.jpg')}
            style={styles.bannerImage}
            resizeMode="cover"
          />

          {/* Text Content */}
          <View style={styles.heroBody}>
            <View style={styles.badgeRow}>
              <Text style={styles.pendingBadge}>● PENDING...</Text>
              <View style={styles.officialBadge}>
                <CheckCircle2 size={12} color="#00E5FF" />
                <Text style={styles.officialText}>Official</Text>
              </View>
            </View>

            <Text style={styles.tournamentTitle}>{tourTitle}</Text>
            <Text style={styles.tournamentSub}>
              Join the elite circle of Nigerian Draft masters.
            </Text>
          </View>
        </View>

        {/* Countdown Timer Grid */}
        <View style={styles.timerGrid}>
          <View style={styles.timerBox}>
            <Text style={styles.timerNum}>{String(hours).padStart(2, '0')}</Text>
            <Text style={styles.timerLabel}>HOURS</Text>
          </View>
          <View style={styles.timerBox}>
            <Text style={styles.timerNum}>{String(minutes).padStart(2, '0')}</Text>
            <Text style={styles.timerLabel}>MINUTES</Text>
          </View>
          <View style={styles.timerBox}>
            <Text style={styles.timerNum}>{String(seconds).padStart(2, '0')}</Text>
            <Text style={styles.timerLabel}>SECONDS</Text>
          </View>
        </View>

        {/* Activation Progress Card */}
        <View style={styles.activationCard}>
          <View style={styles.activationHeader}>
            <View style={styles.inlineRow}>
              <Zap size={18} color="#00E5FF" style={{ marginRight: 6 }} />
              <Text style={styles.activationTitle}>Activation Progress</Text>
            </View>
            <Text style={styles.activationValue}>140 / 200 Units</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.activationTrack}>
            <LinearGradient
              colors={['#00E5FF', '#0284C7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.activationFill, { width: '70%' }]}
            />
          </View>

          <Text style={styles.activationFootnote}>
            The tournament will unlock automatically once the pool is filled.
          </Text>
        </View>

        {/* Circular Progress Ring */}
        <View style={styles.circleChartContainer}>
          <Svg width={size} height={size}>
            <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
              {/* Background Track Circle */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Active Cyan Fill Circle */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#00E5FF"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </G>
          </Svg>

          {/* Center Text inside Circle */}
          <View style={styles.circleCenterTextWrap}>
            <Text style={styles.circleBigNum}>150</Text>
            <Text style={styles.circleSubLabel}>PLAYERS JOINED</Text>
            <Text style={styles.circleFilledTag}>75% FILLED</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleJoinTournament}
          style={styles.primaryOrangeBtn}
        >
          <Swords size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryOrangeBtnText}>
            {joined ? 'Enter Match Lobby' : `Join Championship (${entryFee} Coins)`}
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
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  bannerImage: {
    width: '100%',
    height: 160,
  },
  heroBody: {
    padding: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  pendingBadge: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  officialText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '800',
  },
  tournamentTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
  },
  tournamentSub: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  timerGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  timerBox: {
    flex: 1,
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerNum: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  timerLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },
  activationCard: {
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
  },
  activationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activationTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  activationValue: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '800',
  },
  activationTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  activationFill: {
    height: '100%',
    borderRadius: 4,
  },
  activationFootnote: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },
  circleChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  circleCenterTextWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBigNum: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 46,
  },
  circleSubLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  circleFilledTag: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 4,
  },
  primaryOrangeBtn: {
    flexDirection: 'row',
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
  },
  primaryOrangeBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
});
