import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Gamepad2, Play, Square } from 'lucide-react-native';
import { getActiveMatch, clearActiveMatch } from '../utils/activeMatch';

export default function ActiveMatchBanner({ navigation }) {
  const [activeMatch, setActiveMatchState] = useState(null);

  useEffect(() => {
    let interval;
    const checkMatch = async () => {
      const match = await getActiveMatch();
      setActiveMatchState(match || null);
    };

    checkMatch();
    interval = setInterval(checkMatch, 1500);
    return () => clearInterval(interval);
  }, []);

  if (!activeMatch) return null;

  const handleRejoin = () => {
    if (navigation && activeMatch.targetScreen) {
      navigation.navigate(activeMatch.targetScreen, activeMatch.params || {});
    }
  };

  const handleEndGame = async () => {
    await clearActiveMatch();
    setActiveMatchState(null);
  };

  return (
    <View style={styles.bannerRoot}>
      {/* Top Section: Word / Title & Game Name above buttons */}
      <View style={styles.contentWrap}>
        <View style={styles.pulseDot} />
        <Gamepad2 size={20} color="#00E5FF" style={{ marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>UNFINISHED MATCH 🎮</Text>
          <Text style={styles.bannerSub} numberOfLines={1}>
            {activeMatch.gameName || 'Active Match'} in progress
          </Text>
        </View>
      </View>

      {/* Bottom Section: Action Buttons below words */}
      <View style={styles.btnRow}>
        <TouchableOpacity activeOpacity={0.85} onPress={handleRejoin} style={styles.rejoinBtn}>
          <Play size={14} color="#000000" fill="#000000" />
          <Text style={styles.rejoinBtnText}>REJOIN MATCH</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} onPress={handleEndGame} style={styles.endGameBtn}>
          <Square size={14} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={styles.endGameBtnText}>END GAME</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerRoot: {
    flexDirection: 'column',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  contentWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pulseDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#12FF39',
    marginRight: 8,
  },
  bannerTitle: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bannerSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  rejoinBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00E5FF',
    paddingVertical: 10,
    borderRadius: 12,
  },
  rejoinBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },
  endGameBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 12,
  },
  endGameBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});

