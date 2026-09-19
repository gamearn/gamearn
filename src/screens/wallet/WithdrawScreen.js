import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Building2,
  Clock,
  AlertCircle,
  Circle,
  Coins,
  ShieldCheck,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { wallet } from '../../services/api';

export default function WithdrawScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { userProfile, refreshWallet } = useAuth();

  const coins = userProfile?.coins ?? 0;
  const cashBalance = (coins / 100).toFixed(2);

  const [step, setStep] = useState(1); // 1: Amount, 2: Account details, 3: Confirm
  const [amountInput, setAmountInput] = useState(String(route?.params?.amount ?? ''));
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bank, setBank] = useState(null); // { code, name }
  const [banks, setBanks] = useState([]);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const parsedAmount = parseFloat(amountInput) || 0;
  const isDisabled = parsedAmount <= 0 || parsedAmount > parseFloat(cashBalance);

  useEffect(() => {
    wallet
      .banks()
      .then(setBanks)
      .catch(() => setBanks([]));
  }, []);

  const handleContinueFromAmount = () => {
    if (parsedAmount < 1) {
      Alert.alert('Invalid Amount', 'Enter an amount in naira.');
      return;
    }
    if (parsedAmount > parseFloat(cashBalance)) {
      Alert.alert('Insufficient Balance', 'Your available balance is lower than the requested amount.');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!/^\d{10}$/.test(accountNumber.trim())) {
      Alert.alert('Invalid Account Number', 'Enter a 10-digit Nigerian account number.');
      return;
    }
    if (!bank) {
      Alert.alert('Select Bank', 'Choose the destination bank.');
      return;
    }
    if (accountName.trim().length < 2) {
      Alert.alert('Account Name', 'Enter the account holder name.');
      return;
    }
    setStep(3);
  };

  const handleConfirmWithdrawal = async () => {
    setLoading(true);
    try {
      const res = await wallet.withdraw({
        amount: parsedAmount,
        accountNumber: accountNumber.trim(),
        bankCode: bank.code,
        accountName: accountName.trim(),
      });
      await refreshWallet();
      Alert.alert(
        'Withdrawal Submitted 🎉',
        `Your payout request of ₦${parsedAmount.toLocaleString()} to ${
          bank.name
        } •••• ${accountNumber.slice(-4)} has been submitted.`,
        [
          {
            text: 'Return to Wallet',
            onPress: () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs')),
          },
        ],
      );
    } catch (e) {
      if (e?.code === 'AUTH_REQUIRED' || (e?.message || '').includes('sign in again')) {
        Alert.alert(
          'Re-authentication Required',
          'For your security, withdrawals need a recent sign-in. Please log out and log back in, then try again.',
        );
      } else {
        Alert.alert('Withdrawal Failed', e?.message || 'Could not submit the withdrawal.');
      }
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={goBack} style={[styles.backCircleBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Withdraw</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[
                  styles.progressSegment,
                  { backgroundColor: step >= s ? theme.primary : isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.stepLabel, { color: theme.primary }]}>
            {step === 1 ? 'STEP 1: AMOUNT' : step === 2 ? 'STEP 2: ACCOUNT DETAILS' : 'STEP 3: CONFIRM'}
          </Text>
        </View>

        {step === 1 && (
          <>
            {/* Available Balance Card */}
            <LinearGradient
              colors={isDark ? ['#0F203C', '#0B162B'] : ['#E0F2FE', '#BAE6FD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <Text style={[styles.balanceCardLabel, { color: theme.primary }]}>Available Balance</Text>
              <Text style={[styles.balanceCardAmount, { color: theme.textPrimary }]}>₦{Number(cashBalance).toLocaleString()}</Text>
              <View style={styles.coinsRow}>
                <Coins size={15} color={theme.primary} />
                <Text style={[styles.coinsText, { color: theme.textSecondary }]}>{coins.toLocaleString()} Coins</Text>
              </View>
            </LinearGradient>

            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeaderTitle}>Withdrawal Amount</Text>
              <Text style={[styles.inputLabelText, { color: theme.textSecondary }]}>Enter Amount (NGN)</Text>

              <View style={styles.amountInputBox}>
                <Text style={styles.currencySymbol}>₦</Text>
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
                <Text style={styles.conversionNoteText}>1 coin = ₦0.01 · Withdrawals go to Nigerian bank accounts</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleContinueFromAmount}
              style={[styles.primaryOrangeBtn, { marginTop: 8 }]}
            >
              <Text style={styles.primaryOrangeBtnText}>Continue to Account Details</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeaderTitle}>Destination Bank Account</Text>

              {/* Bank selector */}
              <Text style={[styles.inputLabelText, { color: theme.textSecondary }]}>Bank</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setBankModalOpen(true)}
                style={[styles.accountInputBox, { borderColor: theme.inputBorder }]}
              >
                <Building2 size={20} color={theme.textMuted} />
                <Text style={[styles.pickerText, { color: theme.textPrimary }]}>
                  {bank ? bank.name : 'Select bank'}
                </Text>
                <Circle size={14} color={theme.textMuted} />
              </TouchableOpacity>

              {/* Account number */}
              <Text style={[styles.inputLabelText, { color: theme.textSecondary, marginTop: 14 }]}>Account Number</Text>
              <View style={[styles.accountInputBox, { borderColor: theme.inputBorder }]}>
                <TextInput
                  style={styles.accountNumberInput}
                  value={accountNumber}
                  onChangeText={(t) => setAccountNumber(t.replace(/[^\d]/g, '').slice(0, 10))}
                  keyboardType="number-pad"
                  placeholder="0 1 2 3 4 5 6 7 8 9"
                  placeholderTextColor="#64748B"
                />
              </View>

              {/* Account name */}
              <Text style={[styles.inputLabelText, { color: theme.textSecondary, marginTop: 14 }]}>Account Name</Text>
              <View style={[styles.accountInputBox, { borderColor: theme.inputBorder }]}>
                <TextInput
                  style={styles.accountNameInput}
                  value={accountName}
                  onChangeText={setAccountName}
                  autoCapitalize="words"
                  placeholder="e.g. Chinelo Adebayo"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSubmit}
              style={[styles.primaryOrangeBtn, { marginTop: 8 }]}
            >
              <Text style={styles.primaryOrangeBtnText}>Review Withdrawal</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 3 && (
          <>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewCardTitle}>REVIEW DETAILS</Text>

              <View style={styles.reviewRowMain}>
                <Text style={styles.reviewMainLabel}>Withdrawal Amount</Text>
                <Text style={styles.reviewMainVal}>₦{parsedAmount.toLocaleString()}</Text>
              </View>

              <View style={styles.reviewDivider} />

              <View style={styles.reviewRowSub}>
                <Text style={styles.reviewSubLabel}>Estimated Arrival</Text>
                <View style={styles.inlineRow}>
                  <Clock size={15} color="#00E5FF" style={{ marginRight: 5 }} />
                  <Text style={[styles.reviewSubVal, { color: '#00E5FF' }]}>1-2 Business Days</Text>
                </View>
              </View>

              <View style={styles.reviewRowSub}>
                <Text style={styles.reviewSubLabel}>Destination</Text>
                <Text style={styles.reviewSubVal}>
                  {bank.name} •••• {accountNumber.slice(-4)}
                </Text>
              </View>

              <View style={styles.reviewRowSub}>
                <Text style={styles.reviewSubLabel}>Account Name</Text>
                <Text style={styles.reviewSubVal}>{accountName.trim()}</Text>
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

            <View>
              <Text style={[styles.securityNote, { color: theme.textSecondary }]}>
                <ShieldCheck size={13} color={theme.primary} /> For security, withdrawals require a recent sign-in.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={loading}
              onPress={handleConfirmWithdrawal}
              style={[styles.primaryOrangeBtn, { marginTop: 24 }, loading && { opacity: 0.6 }]}
            >
              <Text style={styles.primaryOrangeBtnText}>
                {loading ? 'Processing Withdrawal...' : 'Confirm Withdrawal'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} onPress={() => setStep(2)} style={styles.cancelOutlineBtn}>
              <Text style={styles.cancelOutlineBtnText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Bank selector modal */}
      <Modal visible={bankModalOpen} transparent animationType="slide" onRequestClose={() => setBankModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.bankModal, { backgroundColor: theme.cardBg }]}>
            <View style={styles.bankModalHeader}>
              <Text style={[styles.bankModalTitle, { color: theme.textPrimary }]}>Select Bank</Text>
              <TouchableOpacity onPress={() => setBankModalOpen(false)}>
                <Text style={[styles.bankModalClose, { color: theme.primary }]}>Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={banks}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setBank(item);
                    setBankModalOpen(false);
                  }}
                  style={[styles.bankRow, { borderBottomColor: theme.inputBorder }]}
                >
                  <Text style={{ color: theme.textPrimary, fontSize: 15 }}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={{ color: theme.textSecondary, padding: 20, textAlign: 'center' }}>
                  {banks.length === 0 ? 'Could not load banks. Pull the list from the backend once more.' : 'No banks found'}
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
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
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  inputLabelText: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 8,
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
  accountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.6)',
    borderWidth: 1,
    borderRadius: 14,
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  accountNumberInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 2,
  },
  accountNameInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  securityNote: {
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  bankModal: {
    maxHeight: '70%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
  },
  bankModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  bankModalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  bankModalClose: {
    fontSize: 14,
    fontWeight: '800',
  },
  bankRow: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
});