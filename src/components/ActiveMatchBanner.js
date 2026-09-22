import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Gamepad2, ArrowRight, X } from 'lucide-react-native';
import { getActiveMatch, clearActiveMatch } from '../utils/activeMatch';

export default function ActiveMatchBanner({ navigation }) {
  const [activeMatch, setActiveMatchState] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    let interval;
    const checkMatch = async () => {
      const match = await getActiveMatch();
      if (match) {
        const remaining = Math.max(0, Math.ceil((match.expiresAt - Date.now()) / 1000));
        if (remaining > 0) {
          setActiveMatchState(match);
          setSecondsLeft(remaining);
        } else {
          setActiveMatchState(null);
          await clearActiveMatch();
        }
      } else {
        setActiveMatchState(null);
      }
    };

    checkMatch();
    interval = setInterval(checkMatch, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!activeMatch || secondsLeft <= 0) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const handleRejoin = () => {
    if (navigation && activeMatch.targetScreen) {
      navigation.navigate(activeMatch.targetScreen, activeMatch.params || {});
    }
  };

  const handleDismiss = async () => {
    await clearActiveMatch();
    setActiveMatchState(null);
  };

  return (
    <View style={styles.bannerRoot}>
      <View style={styles.pulseDot} />
      <Gamepad2 size={20} color="#00E5FF" style={{ marginRight: 8 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.bannerTitle}>MATCH IN PROGRESS 🎮</Text>
        <Text style={styles.bannerSub}>
          {activeMatch.gameName || 'Active Match'} • Rejoin within{' '}
          <Text style={styles.timeText}>{timeFormatted}</Text>
        </Text>
      </View>
      <TouchableOpacity activeOpacity={0.8} onPress={handleRejoin} style={styles.rejoinBtn}>
        <Text style={styles.rejoinBtnText}>REJOIN</Text>
        <ArrowRight size={14} color="#000000" />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
        <X size={16} color="#94A3B8" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerRoot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#12FF39',
    marginRight: 8,
  },
  bannerTitle: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bannerSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  timeText: {
    color: '#FF5500',
    fontWeight: '900',
  },
  rejoinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00E5FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 8,
  },
  rejoinBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
  },
  closeBtn: {
    padding: 4,
    marginLeft: 6,
  },
});
