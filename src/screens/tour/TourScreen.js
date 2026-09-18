import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Trophy, Coins, Users, Zap, Shield, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const TOURNAMENTS = [
  {
    id: 't1',
    title: 'Neon Dráfù Season 4',
    game: 'Dráfù',
    type: 'NUMBER-OF-PLAYS',
    entryFee: '50 GC',
    players: '18 / 32',
    status: 'PENDING ENTRY',
    statusColor: '#F59E0B',
    avatars: [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    ],
    moreCount: '+12',
  },
  {
    id: 't2',
    title: 'Lúùdò Legends: Void Hunt',
    game: 'Lúùdò',
    type: 'WIN-BASED',
    entryFee: '50 GC',
    players: '4 / 16',
    status: 'PENDING ENTRY',
    statusColor: '#F59E0B',
    avatars: [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    ],
    moreCount: '+2',
  },
  {
    id: 't3',
    title: 'Ayò Ọ̀pọ́n Grandmaster Cup',
    game: 'Ayò Ọ̀pọ́n',
    type: 'WIN-BASED',
    entryFee: '100 GC',
    players: '32 / 32',
    status: 'LIVE NOW',
    statusColor: '#00E5FF',
    avatars: [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    ],
    moreCount: '+30',
  },
  {
    id: 't4',
    title: 'Dráfù Grandmaster Championship',
    game: 'Dráfù',
    type: 'WIN-BASED',
    entryFee: '₦500.00',
    players: '150 / 150',
    status: 'COMPLETED',
    statusColor: '#10B981',
    avatars: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
    ],
    moreCount: '+148',
  },
];

export default function TourScreen({ navigation }) {
  const { userProfile } = useAuth();
  const { theme, isDark } = useTheme();
  const userName = userProfile?.name || 'Adebayo';

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />

      {/* Screen Title */}
      <View style={styles.topHeader}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Tournament Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Host Your Own Banner */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => navigation.navigate('CreateTournament')}
          style={styles.hostBannerContainer}
        >
          <LinearGradient
            colors={isDark ? ['#0D192F', '#091326'] : ['#E0F2FE', '#BAE6FD']}
            style={styles.hostBannerGradient}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.hostLabel, { color: theme.primary }]}>HOST YOUR OWN</Text>
              <Text style={[styles.hostTitle, { color: theme.textPrimary }]}>Create Tournament</Text>
            </View>
            <View style={styles.orangePlusCircle}>
              <Plus size={24} color="#FFFFFF" strokeWidth={3} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* User Profile Bar */}
        <View style={styles.userBarCard}>
          <LinearGradient
            colors={isDark ? ['rgba(15, 45, 70, 0.8)', 'rgba(8, 28, 48, 0.8)'] : ['#FFFFFF', '#F1F5F9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.userBarGradient, { borderColor: theme.cardBorderSubtle }]}
          >
            <View style={styles.userInfoLeft}>
              <View style={styles.userAvatarRing}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' }}
                  style={styles.userAvatarImg}
                />
              </View>
              <Text style={[styles.userNameText, { color: theme.textPrimary }]}>{userName}</Text>
            </View>

            <View style={styles.userStatsRight}>
              <Text style={[styles.xpText, { color: theme.primary }]}>78,450 XP</Text>
              <Text style={[styles.winsText, { color: theme.textSecondary }]}>50 Wins</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Tournament List */}
        <View style={styles.tourList}>
          {TOURNAMENTS.map((item) => (
            <View key={item.id} style={styles.tourCard}>
              <LinearGradient
                colors={isDark ? ['rgba(15, 30, 55, 0.75)', 'rgba(10, 20, 40, 0.75)'] : ['#FFFFFF', '#F8FAFC']}
                style={[styles.tourCardGradient, { borderColor: theme.cardBorderSubtle }]}
              >
                {/* Header Badge Row */}
                <View style={styles.tourCardHeader}>
                  <View style={styles.statusRow}>
                    <View style={[styles.dot, { backgroundColor: item.statusColor }]} />
                    <Text style={[styles.statusText, { color: item.statusColor }]}>{item.status}</Text>
                  </View>

                  <View style={[styles.gcBadge, { backgroundColor: isDark ? 'rgba(0, 229, 255, 0.1)' : 'rgba(0, 180, 216, 0.1)' }]}>
                    <Coins size={14} color={theme.primary} style={{ marginRight: 4 }} />
                    <Text style={[styles.gcBadgeText, { color: theme.primary }]}>{item.entryFee}</Text>
                  </View>
                </View>

                {/* Tournament Info */}
                <Text style={[styles.tourCardTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.tourCardType, { color: theme.textSecondary }]}>{item.type}</Text>

                {/* Footer: Avatars + View Details Button */}
                <View style={styles.tourCardFooter}>
                  <View>
                    <View style={styles.avatarStack}>
                      {item.avatars.map((url, idx) => (
                        <Image
                          key={idx}
                          source={{ uri: url }}
                          style={[styles.stackAvatar, { marginLeft: idx === 0 ? 0 : -10 }]}
                        />
                      ))}
                      <View style={[styles.stackAvatar, styles.moreAvatarBox, { marginLeft: -10 }]}>
                        <Text style={styles.moreAvatarText}>{item.moreCount}</Text>
                      </View>
                    </View>
                    <Text style={styles.joinedCountText}>{item.players} PLAYERS JOINED</Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      if (item.status === 'LIVE NOW') {
                        navigation.navigate('LiveTournament', { tourId: item.id, title: item.title });
                      } else if (item.status === 'PENDING ENTRY') {
                        navigation.navigate('TournamentPending', { tourId: item.id, title: item.title, entryFee: item.entryFee });
                      } else if (item.status === 'COMPLETED') {
                        navigation.navigate('TournamentResults', { tourId: item.id, title: item.title });
                      } else {
                        navigation.navigate('TournamentDetails', { tourId: item.id, title: item.title });
                      }
                    }}
                    style={styles.viewDetailsBtn}
                  >
                    <Text style={styles.viewDetailsText}>VIEW DETAILS</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          ))}
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
    paddingTop: 60,
    paddingBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 110,
  },
  hostBannerContainer: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FF5500',
    overflow: 'hidden',
    marginBottom: 16,
  },
  hostBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  hostLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  hostTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  orangePlusCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF5500',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5500',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  userBarCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    overflow: 'hidden',
    marginBottom: 20,
  },
  userBarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatarRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    overflow: 'hidden',
    marginRight: 12,
  },
  userAvatarImg: {
    width: '100%',
    height: '100%',
  },
  userNameText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  userStatsRight: {
    alignItems: 'flex-end',
  },
  xpText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '800',
  },
  winsText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  tourList: {
    gap: 16,
  },
  tourCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  tourCardGradient: {
    padding: 18,
  },
  tourCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  gcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  gcBadgeText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '900',
  },
  tourCardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  tourCardType: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  tourCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stackAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#091026',
  },
  moreAvatarBox: {
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreAvatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  joinedCountText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
  },
  viewDetailsBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  viewDetailsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
