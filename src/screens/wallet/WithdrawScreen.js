import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Wallet,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  Coins,
  ShieldCheck,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function WithdrawScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { userProfile, updateProfileData } = useAuth();

  const coins = userProfile?.coins ?? 12500;
  const cashBalance = (coins / 100).toFixed(2);

  const [step, setStep] = useState(1); // 1: Amount & Method, 2: Confirm Withdrawal
  const [amountInput, setAmountInput] = useState('150.00');
  const [payoutMethod, setPayoutMethod] = useState('bank'); // 'bank', 'paypal', 'wallet'
  const [accountDestination, setAccountDestination] = useState('Visa •••• 4242');
  const [loading, setLoading] = useState(false);

  const parsedAmount = parseFloat(amountInput) || 0;
  const serviceFee = payoutMethod === 'paypal' ? 0.5 : 0.0;
  const totalDeduction = parsedAmount;

  const handleContinueToReview = () => {
    if (parsedAmount < 10 || parsedAmount > 500) {
      Alert.alert('Invalid Amount', 'Please enter an amount between $10.00 and $500.00.');
      return;
    }
    if (parsedAmount > parseFloat(cashBalance)) {
      Alert.alert('Insufficient Balance', 'Your available cash balance is lower than the requested amount.');
      return;
    }
    setStep(2);
  };

  const handleConfirmWithdrawal = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const coinsDeducted = Math.round(parsedAmount * 100);
      const newCoinBalance = Math.max(0, coins - coinsDeducted);

      if (updateProfileData && userProfile) {
        updateProfileData({ coins: newCoinBalance });
      }

      Alert.alert(
        'Withdrawal Submitted 🎉',
        `Your payout request of $${parsedAmount.toFixed(2)} to ${accountDestination} has been submitted successfully!`,
        [
          {
            text: 'Return to Wallet',
            onPress: () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs')),
          },
        ]
      );
    }, 1200);
  };

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => {
            if (step === 2) {
              setStep(1);
            } else if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MainTabs');
            }
          }}
          style={[styles.backCircleBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}
        >
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Withdraw</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressSegment, { backgroundColor: theme.primary }]} />
            <View
              style={[
                styles.progressSegment,
                { backgroundColor: step === 2 ? theme.primary : isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' },
              ]}
            />
          </View>
          <Text style={[styles.stepLabel, { color: theme.primary }]}>
            {step === 1 ? 'STEP 1: AMOUNT & METHOD' : 'STEP 2: CONFIRM WITHDRAWAL'}
          </Text>
        </View>

        {step === 1 ? (
          /* STEP 1: AMOUNT & METHOD */
          <>
            {/* Available Balance Card */}
            <LinearGradient
              colors={isDark ? ['#0F203C', '#0B162B'] : ['#E0F2FE', '#BAE6FD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <Text style={[styles.balanceCardLabel, { color: theme.primary }]}>Available Cash Balance</Text>
              <Text style={[styles.balanceCardAmount, { color: theme.textPrimary }]}>${cashBalance}</Text>
              <View style={styles.coinsRow}>
                <Coins size={15} color={theme.primary} />
                <Text style={[styles.coinsText, { color: theme.textSecondary }]}>{coins.toLocaleString()} Coins</Text>
              </View>
            </LinearGradient>

            {/* Withdrawal Amount Section */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeaderTitle}>Withdrawal Amount</Text>
              <View style={styles.inputSubHeader}>
                <Text style={styles.inputLabelText}>Enter Amount</Text>
                <Text style={styles.limitText}>Min $10.00 / Max $500.00</Text>
              </View>

              <View style={styles.amountInputBox}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountTextInput}
                  value={amountInput}
                  onChangeText={setAmountInput}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.conversionNoteRow}>
                <AlertCircle size={14} color="#64748B" />
                <Text style={styles.conversionNoteText}>Conversion rate: 100 Coins = $1.00</Text>
              </View>
            </View>

            {/* Payout Method Section */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeaderTitle}>Payout Method</Text>

              {/* Option 1: Bank Transfer */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setPayoutMethod('bank');
                  setAccountDestination('Bank •••• 6789');
                }}
                style={[
                  styles.methodCard,
                  payoutMethod === 'bank' && styles.methodCardActive,
                ]}
              >
                <View style={styles.methodIconBox}>
                  <Building2 size={22} color="#00E5FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>Bank Transfer</Text>
                  <Text style={styles.methodSub}>2-3 Business Days • Free</Text>
                </View>
                {payoutMethod === 'bank' ? (
                  <CheckCircle2 size={22} color="#00E5FF" />
                ) : (
                  <Circle size={22} color="#334155" />
                )}
              </TouchableOpacity>

              {/* Option 2: PayPal */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setPayoutMethod('paypal');
                  setAccountDestination('user@paypal.com');
                }}
                style={[
                  styles.methodCard,
                  payoutMethod === 'paypal' && styles.methodCardActive,
                ]}
              >
                <View style={styles.methodIconBox}>
                  <CreditCard size={22} color="#00E5FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>PayPal</Text>
                  <Text style={styles.methodSub}>Instant • $0.50 Fee</Text>
                </View>
                {payoutMethod === 'paypal' ? (
                  <CheckCircle2 size={22} color="#00E5FF" />
                ) : (
                  <Circle size={22} color="#334155" />
                )}
              </TouchableOpacity>

              {/* Option 3: Digital Wallet */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setPayoutMethod('wallet');
                  setAccountDestination('Visa •••• 4242');
                }}
                style={[
                  styles.methodCard,
                  payoutMethod === 'wallet' && styles.methodCardActive,
                ]}
              >
                <View style={styles.methodIconBox}>
                  <Wallet size={22} color="#00E5FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>Digital Wallet</Text>
                  <Text style={styles.methodSub}>Instant • Free</Text>
                </View>
                {payoutMethod === 'wallet' ? (
                  <CheckCircle2 size={22} color="#00E5FF" />
                ) : (
                  <Circle size={22} color="#334155" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleContinueToReview}
              style={styles.primaryOrangeBtn}
            >
              <Text style={styles.primaryOrangeBtnText}>Continue to Review</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* STEP 2: CONFIRM WITHDRAWAL */
          <>
            {/* Review Details Card */}
            <View style={styles.reviewCard}>
              <Text style={styles.reviewCardTitle}>REVIEW DETAILS</Text>

              <View style={styles.reviewRowMain}>
                <Text style={styles.reviewMainLabel}>Withdrawal Amount</Text>
                <Text style={styles.reviewMainVal}>${parsedAmount.toFixed(2)}</Text>
              </View>

              <View style={styles.reviewDivider} />

              <View style={styles.reviewRowSub}>
                <Text style={styles.reviewSubLabel}>Service Fee</Text>
                <Text style={styles.reviewSubVal}>${serviceFee.toFixed(2)}</Text>
              </View>

              <View style={styles.reviewRowSub}>
                <Text style={styles.reviewSubLabel}>Estimated Arrival</Text>
                <View style={styles.inlineRow}>
                  <Clock size={15} color="#00E5FF" style={{ marginRight: 5 }} />
                  <Text style={[styles.reviewSubVal, { color: '#00E5FF' }]}>
                    {payoutMethod === 'bank' ? '2-3 Business Days' : 'Instant'}
                  </Text>
                </View>
              </View>

              <View style={styles.reviewRowSub}>
                <Text style={styles.reviewSubLabel}>Destination</Text>
                <Text style={styles.reviewSubVal}>{accountDestination}</Text>
              </View>
            </View>

            {/* Warning Banner */}
            <View style={styles.warningBanner}>
              <View style={styles.warningIconCircle}>
                <AlertCircle size={20} color="#FF6600" />
              </View>
              <Text style={styles.warningText}>
                Please ensure your account information is correct. Withdrawals to incorrect accounts
                may not be reversible.
              </Text>
            </View>

            {/* Actions */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={loading}
              onPress={handleConfirmWithdrawal}
              style={[styles.primaryOrangeBtn, { marginTop: 32 }, loading && { opacity: 0.6 }]}
            >
              <Text style={styles.primaryOrangeBtnText}>
                {loading ? 'Processing Withdrawal...' : 'Confirm Withdrawal'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setStep(1)}
              style={styles.cancelOutlineBtn}
            >
              <Text style={styles.cancelOutlineBtnText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
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
  progressContainer: {
    marginBottom: 24,
  },
  progressTrack: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    gap: 8,
    marginBottom: 10,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepLabel: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    marginBottom: 24,
  },
  balanceCardLabel: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  balanceCardAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 6,
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinsText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionWrap: {
    marginBottom: 24,
  },
  sectionHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  inputSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabelText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  limitText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '700',
  },
  amountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  currencySymbol: {
    color: '#94A3B8',
    fontSize: 26,
    fontWeight: '700',
    marginRight: 10,
  },
  amountTextInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  conversionNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  conversionNoteText: {
    color: '#64748B',
    fontSize: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  methodCardActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
  },
  methodIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  methodSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
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
  },
  primaryOrangeBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  reviewCard: {
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  reviewCardTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
  },
  reviewRowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  reviewMainLabel: {
    color: '#94A3B8',
    fontSize: 15,
  },
  reviewMainVal: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },
  reviewDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  reviewRowSub: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  reviewSubLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  reviewSubVal: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 102, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 102, 0, 0.3)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  warningIconCircle: {
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
  },
  cancelOutlineBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  cancelOutlineBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
