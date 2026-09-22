import React, { useState } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import GAButton from './GAButton';
import { GoogleIcon, FacebookIcon } from './SocialIcons';
import { useAuth } from '../context/AuthContext';

export default function SocialSignInButtons({ agreed = true }) {
  const { signUpWithGoogle, signUpWithFacebook, signUpWithApple, loading } = useAuth();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const run = async (name, signIn) => {
    if (busy || loading) return;
    if (!agreed) { setError('Please agree to the Terms and Conditions first.'); return; }
    setError('');
    setBusy(name);
    try { await signIn(); }
    catch (e) { setError(e.message || `${name} sign-in failed. Please try again.`); }
    finally { setBusy(null); }
  };
  return (
    <View style={styles.container}>
      <GAButton title="Google" variant="social" icon={<GoogleIcon size={18} />}
        disabled={!!busy || loading} loading={busy === 'Google'} onPress={() => run('Google', signUpWithGoogle)} />
      <GAButton title="Facebook" variant="social" icon={<FacebookIcon size={18} />}
        disabled={!!busy || loading} loading={busy === 'Facebook'} onPress={() => run('Facebook', signUpWithFacebook)} />
      {Platform.OS === 'ios' && (
        <View pointerEvents={busy || loading ? 'none' : 'auto'}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={12} style={styles.apple}
            onPress={() => run('Apple', signUpWithApple)} />
        </View>
      )}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 12, marginBottom: 16 },
  apple: { width: '100%', height: 50 },
  error: { color: '#EF4444', textAlign: 'center', fontSize: 13 },
});
