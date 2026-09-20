import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Mail, Lock } from 'lucide-react-native';
import GAButton from '../../components/GAButton';
import GAInput from '../../components/GAInput';
import SocialSignInButtons from '../../components/SocialSignInButtons';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { signIn, backendReady, user, loading: authLoading, authError } = useAuth();
  const focused = useIsFocused();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const didNavigate = React.useRef(false);

  useEffect(() => {
    const routeHome = () => {
      if (didNavigate.current || !focused || authLoading || !user) return;
      didNavigate.current = true;
      navigation.replace(!user.emailVerified && user.providerData?.some(p => p.providerId === 'password') ? 'EmailVerification' : backendReady ? 'MainTabs' : 'ProfileSetup', { email: user.email });
    };
    routeHome();
  }, [user, backendReady, authLoading, focused, navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // signIn loads the backend profile; navigate from the effect above.
    } catch (e) {
      setError(e.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flexContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Clean Background Image with Glowing Neon & 3D Games */}
      <Image
        pointerEvents="none"
        source={require('../../../assets/auth/login_bg.png')}
        style={styles.fixedBackground}
        resizeMode="cover"
      />
      <View pointerEvents="none" style={styles.fixedDarkOverlay} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
      >
        {/* Top Logo */}
        <View style={styles.logoSection}>
          <View style={styles.glowingBadge}>
            <Image
              source={require('../../../assets/logos/logo_icon.png')}
              style={styles.logoIcon}
              resizeMode="contain"
            />
            <Text style={styles.logoBadgeText}>GAMEARN</Text>
          </View>
        </View>

        {/* Heading */}
        <View style={styles.headingSection}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Your next game starts here.</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {error || authError ? <Text style={styles.errorText}>{error || authError}</Text> : null}

          <GAInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            keyboardType="email-address"
            leftIcon={<Mail size={20} color="#64748B" />}
          />

          <GAInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry={true}
            leftIcon={<Lock size={20} color="#64748B" />}
          />

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Log In CTA Button */}
          <GAButton
            title="Log In"
            onPress={handleLogin}
            loading={loading}
            variant="primary"
            showArrow={true}
            style={styles.loginBtn}
          />

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <SocialSignInButtons />

          {/* Footer Sign Up Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New to GAMEARN? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.8}
            >
              <Text style={styles.footerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Tagline */}
          <View style={styles.bottomFooter}>
            <Text style={styles.footerTagline}>
              PLAY  <Text style={{ color: '#00E5FF' }}>•</Text>  EARN  <Text style={{ color: '#FF6B00' }}>•</Text>  BELONG
            </Text>
            <View style={styles.footerIndicator} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
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
    width: 42,
    height: 42,
  },
  logoBadgeText: {
    color: '#00E5FF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    marginTop: 6,
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 20,
  },
  forgotText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '600',
  },
  loginBtn: {
    marginBottom: 18,
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
    marginBottom: 24,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  footerLink: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomFooter: {
    alignItems: 'center',
  },
  footerTagline: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  footerIndicator: {
    width: 60,
    height: 3,
    backgroundColor: '#00E5FF',
    borderRadius: 2,
    marginTop: 6,
  },
});
