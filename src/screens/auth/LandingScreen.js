import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Gamepad2, Trophy, Gift, Users, Check } from 'lucide-react-native';
import GAButton from '../../components/GAButton';
import { GoogleIcon, AppleIcon, FacebookIcon } from '../../components/SocialIcons';
import { useAuth } from '../../context/AuthContext';

export default function LandingScreen({ navigation }) {
  const { signUpWithGoogle, backendReady, user } = useAuth();
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigation.replace(backendReady ? 'MainTabs' : 'ProfileSetup');
    }
  }, [user, backendReady, navigation]);

  const handleGoogle = async () => {
    if (!agreed) {
      Alert.alert('Terms & Conditions', 'Please agree to the Terms and Conditions first.');
      return;
    }
    setLoading(true);
    try {
      await signUpWithGoogle();
      setTimeout(() => setLoading(false), 300);
    } catch (e) {
      setLoading(false);
      Alert.alert('Google Sign-In', e.message || 'Please try again.');
    }
  };

  const handleComingSoon = (provider) => {
    Alert.alert(`${provider} Sign-In`, `${provider} sign-in is coming soon. Use email or Google for now.`);
  };

  return (
    <View style={styles.flexContainer}>
      {/* Clean Background Image with Glowing Neon Frames & 3D Games */}
      <Image
        source={require('../../../assets/auth/landing_bg.png')}
        style={styles.fixedBackground}
        resizeMode="cover"
      />
      <View style={styles.fixedDarkOverlay} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Right Header Menu */}
        <View style={styles.topHeader}>
          <View style={styles.topRightMenu}>
            <Text style={styles.topMenuText}>Play  Earn  Belong</Text>
            <View style={styles.cyanIndicator} />
          </View>
        </View>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.glowingBadge}>
            <Image
              source={require('../../../assets/logos/logo_icon.png')}
              style={styles.logoIcon}
              resizeMode="contain"
            />
            <Text style={styles.logoBadgeText}>GAMEARN</Text>
          </View>
          <Text style={styles.taglineSubText}>ELITE BOARD GAMING TOURNAMENTS</Text>
        </View>

        {/* 4 Feature Cards Row */}
        <View style={styles.featureGrid}>
          <View style={styles.featureCard}>
            <View style={[styles.cardIconBox, { backgroundColor: 'rgba(0, 229, 255, 0.15)', borderColor: '#00E5FF' }]}>
              <Gamepad2 size={20} color="#00E5FF" />
            </View>
            <Text style={styles.cardTitle}>PLAY</Text>
            <Text style={styles.cardSub}>YOUR FAVORITE GAMES</Text>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.cardIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B' }]}>
              <Trophy size={20} color="#F59E0B" />
            </View>
            <Text style={styles.cardTitle}>COMPETE</Text>
            <Text style={styles.cardSub}>IN TOURNAMENTS</Text>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.cardIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.15)', borderColor: '#EC4899' }]}>
              <Gift size={20} color="#EC4899" />
            </View>
            <Text style={styles.cardTitle}>EARN</Text>
            <Text style={styles.cardSub}>REAL REWARDS</Text>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.cardIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }]}>
              <Users size={20} color="#10B981" />
            </View>
            <Text style={styles.cardTitle}>BELONG</Text>
            <Text style={styles.cardSub}>TO A BIGGER COMMUNITY</Text>
          </View>
        </View>

        {/* Hero Welcome Title */}
        <View style={styles.heroTitleSection}>
          <Text style={styles.welcomeSubtitle}>WELCOME TO</Text>
          <View style={styles.titleRow}>
            <Text style={styles.gamText}>GAM</Text>
            <Text style={styles.earnText}>EARN</Text>
          </View>
          <View style={styles.cursiveWrapper}>
            <Text style={styles.cursiveSubtitle}>More Than Games</Text>
            <View style={styles.swooshLine} />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <GAButton
            title="Create Account"
            onPress={() => navigation.navigate('Register')}
            variant="primary"
            showArrow={true}
            style={styles.btnMargin}
          />

          <GAButton
            title="Log In"
            onPress={() => navigation.navigate('Login')}
            variant="outline"
            showArrow={true}
            style={styles.btnMargin}
          />

          {/* Social Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialRow}>
            <View style={{ flex: 1 }}>
              <GAButton
                title="Google"
                onPress={handleGoogle}
                variant="social"
                loading={loading}
                disabled={loading}
                icon={<GoogleIcon size={18} />}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <GAButton
                title="Apple"
                onPress={() => handleComingSoon('Apple')}
                variant="social"
                icon={<AppleIcon size={18} color="#FFFFFF" />}
              />
            </View>
          </View>

          <GAButton
            title="Facebook"
            onPress={() => handleComingSoon('Facebook')}
            variant="social"
            icon={<FacebookIcon size={18} />}
            style={{ marginTop: 10 }}
          />

          {/* Terms Checkbox */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
              {agreed && <Check size={12} color="#FFFFFF" />}
            </View>
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text
                style={styles.termsLink}
                onPress={() => Alert.alert('Terms & Conditions', 'Gamearn Terms and Conditions agreement.')}
              >
                Terms and Conditions
              </Text>{' '}
              and{' '}
              <Text
                style={styles.termsLink}
                onPress={() => Alert.alert('Privacy Policy', 'Gamearn Privacy Policy agreement.')}
              >
                Privacy Policy
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Bottom Tagline */}
          <View style={styles.bottomFooter}>
            <Text style={styles.footerTagline}>GOOD GAMES  •  BIGGER FRIENDSHIPS</Text>
            <View style={styles.footerIndicator} />
          </View>
        </View>
      </ScrollView>
    </View>
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
  fixedDarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 14, 26, 0.35)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: 'center',
  },
  topHeader: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  topRightMenu: {
    alignItems: 'center',
  },
  topMenuText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cyanIndicator: {
    width: 36,
    height: 2.5,
    backgroundColor: '#00E5FF',
    borderRadius: 2,
    marginTop: 3,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  glowingBadge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#0B132B',
    borderWidth: 2,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  logoIcon: {
    width: 40,
    height: 40,
  },
  logoBadgeText: {
    color: '#00E5FF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
  },
  taglineSubText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 10,
  },
  featureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  featureCard: {
    flex: 1,
    marginHorizontal: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardSub: {
    color: '#64748B',
    fontSize: 7,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  heroTitleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  gamText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#00E5FF',
    letterSpacing: 1,
  },
  earnText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FF5722',
    letterSpacing: 1,
  },
  cursiveWrapper: {
    alignItems: 'center',
  },
  cursiveSubtitle: {
    color: '#E2E8F0',
    fontSize: 22,
    fontStyle: 'italic',
    fontFamily: 'serif',
    fontWeight: '700',
  },
  swooshLine: {
    width: 100,
    height: 3,
    backgroundColor: '#00E5FF',
    borderRadius: 2,
    marginTop: 2,
  },
  actionContainer: {
    width: '100%',
  },
  btnMargin: {
    marginBottom: 12,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dividerText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  socialRow: {
    flexDirection: 'row',
    width: '100%',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  checkboxActive: {
    backgroundColor: '#00E5FF',
  },
  termsText: {
    color: '#94A3B8',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  termsLink: {
    color: '#00E5FF',
    fontWeight: '700',
  },
  bottomFooter: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerTagline: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  footerIndicator: {
    width: 50,
    height: 3,
    backgroundColor: '#00E5FF',
    borderRadius: 2,
    marginTop: 6,
  },
});
