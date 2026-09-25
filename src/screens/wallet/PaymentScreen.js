import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, BackHandler, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { wallet } from '../../services/api';

const SUCCESS_STATUSES = new Set(['completed', 'successful', 'success', 'paid']);

export default function PaymentScreen({ navigation, route }) {
  const { txRef, paymentLink, amount, coins } = route.params || {};
  const { theme, isDark } = useTheme();
  const { refreshWallet } = useAuth();
  const [paying, setPaying] = useState(true);
  const [result, setResult] = useState(null);
  const alive = useRef(true);

  useEffect(() => {
    const poll = setInterval(async () => {
      if (!txRef) return;
      try {
        const res = await wallet.verify(txRef);
        const status = String(res?.status || '').toLowerCase();
        if (status && status !== 'pending') {
          clearInterval(poll);
          if (!alive.current) return;
          const ok = SUCCESS_STATUSES.has(status);
          setPaying(false);
          setResult(ok ? 'success' : 'failed');
          if (ok) await refreshWallet().catch(() => {});
        }
      } catch {
        // keep polling; the row may not be recorded locally yet
      }
    }, 2500);

    const onHardwareBack = () => {
      if (result === 'success') return false;
      stopPolling();
      clearInterval(poll);
      navigation.goBack();
      return true;
    };
    const backSub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => {
      alive.current = false;
      clearInterval(poll);
      backSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txRef]);

  const stopPolling = () => {
    alive.current = false;
  };

  const close = () => {
    stopPolling();
    navigation.canGoBack() ? navigation.goBack() : navigation.navigate('BuyCoins');
  };

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />

      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={close}
          style={[styles.backCircleBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}
        >
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.webWrap}>
        {paymentLink ? (
          <WebView
            key={paymentLink}
            source={{ uri: paymentLink }}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loadingState}>
                <ActivityIndicator color={theme.primary} size="large" />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading secure payment page...</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.loadingState}>
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>No payment link available.</Text>
          </View>
        )}
      </View>

      <View style={[styles.footerBar, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
        {paying ? (
          <View style={styles.footerRow}>
            <ActivityIndicator color={theme.primary} size="small" />
            <Text style={[styles.footerText, { color: theme.textPrimary }]}>
              Complete payment to add {Number(coins || 0).toLocaleString()} coins{amount ? ` (₦${Number(amount).toLocaleString()})` : ''}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={close}
            style={[styles.resultBtn, { backgroundColor: result === 'success' ? '#10B981' : '#EF4444' }]}
          >
            {result === 'success' ? (
              <CheckCircle2 size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            ) : (
              <XCircle size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.resultBtnText}>
              {result === 'success' ? 'Payment Confirmed - Done' : 'Payment Not Completed - Close'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
    paddingTop: 55,
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
  webWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '800',
  },
  resultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  resultBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});