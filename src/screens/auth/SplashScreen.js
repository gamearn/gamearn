import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Gamepad2, Trophy, Coins, Users, Wifi } from 'lucide-react-native';
import { CrownIcon } from '../../components/SocialIcons';
import { useAuth } from '../../context/AuthContext';

export default function SplashScreen({ navigation }) {
  const { user, backendReady, loading } = useAuth();
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 18) + 12;
        return next > 100 ? 100 : next;
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 200,
      useNativeDriver: false,
    }).start();

    if (progress === 100) {
      const timeout = setTimeout(() => {
        handleProceed();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [progress, loading, user, backendReady]);

  const handleProceed = () => {
    if (loading) return;
    if (!user) {
      navigation.replace('Landing');
    } else if (!user.emailVerified && user.providerData?.some(p => p.providerId === 'password')) {
      navigation.replace('EmailVerification', { email: user.email });
    } else if (!backendReady) {
      // Signed in to Firebase but no backend profile yet → complete onboarding.
      navigation.replace('ProfileSetup');
    } else {
      navigation.replace('MainTabs');
    }
  };

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleProceed}
      style={styles.flexContainer}
    >
      {/* Clean Background Image with 3D Board Games & No Words */}
      <Image
        source={require('../../../assets/auth/splash_bg.png')}
        style={styles.fixedBackground}
        resizeMode="cover"
      />

      <View style={styles.overlay}>
        {/* Top Right Tagline */}
        <View style={styles.topRightTagline}>
          <Text style={styles.cursiveTaglineText}>Good Games</Text>
          <Text style={styles.cursiveTaglineText}>Bigger Rewards</Text>
        </View>

        {/* Center App Badge */}
        <View style={styles.centerBadgeWrapper}>
          <View style={styles.glowingAppBadge}>
            <Image
              source={require('../../../assets/logos/logo_icon.png')}
              style={styles.logoIconImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Hero Title Section */}
        <View style={styles.heroSection}>
          <Text style={styles.welcomeText}>WELCOME TO</Text>

          <View style={styles.titleContainer}>
            <View style={styles.crownPosition}>
              <CrownIcon size={24} color="#FFD700" />
            </View>
            <View style={styles.titleRow}>
              <Text style={styles.gamText}>GAM</Text>
              <Text style={styles.earnText}>EARN</Text>
            </View>
          </View>

          <View style={styles.pillTagline}>
            <Text style={styles.pillText}>
              PLAY <Text style={{ color: '#00E5FF' }}>•</Text> EARN <Text style={{ color: '#FF6B00' }}>•</Text> BELONG
            </Text>
          </View>

          {/* 4 Feature Category Icons */}
          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIconCircle, { borderColor: '#00E5FF' }]}>
                <Gamepad2 size={20} color="#00E5FF" />
              </View>
              <Text style={styles.featureLabel}>PLAY</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconCircle, { borderColor: '#F59E0B' }]}>
                <Trophy size={20} color="#F59E0B" />
              </View>
              <Text style={styles.featureLabel}>COMPETE</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconCircle, { borderColor: '#F59E0B' }]}>
                <Coins size={20} color="#F59E0B" />
              </View>
              <Text style={styles.featureLabel}>EARN</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconCircle, { borderColor: '#10B981' }]}>
                <Users size={20} color="#10B981" />
              </View>
              <Text style={styles.featureLabel}>BELONG</Text>
            </View>
          </View>
        </View>

        {/* Bottom Loading Progress Section */}
        <View style={styles.bottomSection}>
          <Text style={styles.initializingText}>INITIALIZING ARENA...</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: barWidth }]} />
            </View>
            <Text style={styles.progressPercentage}>{progress}%</Text>
          </View>

          <View style={styles.secureConnectionRow}>
            <Wifi size={14} color="#10B981" style={{ marginRight: 6 }} />
            <Text style={styles.secureConnectionText}>SECURE CONNECTION ESTABLISHED</Text>
          </View>

          <View style={styles.goldFrameContainer}>
            <Text style={styles.cursiveFooterText}>More Than Games</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  fixedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    ...(Platform.OS === 'web'
      ? {
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : {}),
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 26, 0.35)',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 45,
    paddingBottom: 24,
  },
  topRightTagline: {
    position: 'absolute',
    top: 45,
    right: 24,
    alignItems: 'flex-end',
    transform: [{ rotate: '-5deg' }],
  },
  cursiveTaglineText: {
    color: '#FFD700',
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '700',
    fontFamily: 'serif',
  },
  centerBadgeWrapper: {
    alignItems: 'center',
    marginTop: 30,
  },
  glowingAppBadge: {
    width: 125,
    height: 125,
    borderRadius: 28,
    backgroundColor: '#0B132B',
    borderWidth: 2,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  logoIconImage: {
    width: '90%',
    height: '90%',
  },
  heroSection: {
    alignItems: 'center',
  },
  welcomeText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 4,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  crownPosition: {
    marginBottom: -8,
    zIndex: 2,
    marginLeft: 30,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gamText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#00E5FF',
    letterSpacing: 1,
  },
  earnText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FF5722',
    letterSpacing: 1,
  },
  pillTagline: {
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    marginBottom: 20,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  featureLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bottomSection: {
    alignItems: 'center',
    width: '100%',
  },
  initializingText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  progressTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00E5FF',
    borderRadius: 6,
  },
  progressPercentage: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '800',
    width: 40,
  },
  secureConnectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  secureConnectionText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  goldFrameContainer: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
  },
  cursiveFooterText: {
    color: '#F59E0B',
    fontSize: 18,
    fontStyle: 'italic',
    fontFamily: 'serif',
    fontWeight: '700',
  },
});
