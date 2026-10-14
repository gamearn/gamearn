import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Swords,
  Wallet,
  Key,
  LifeBuoy,
  ChevronDown,
  Trash2,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { auth, content } from '../../services/api';

const FALLBACK_SECTIONS = [
  {
    id: 'games',
    title: 'Tournament Rules',
    items: [
      {
        question: 'Can I play for free?',
        answer:
          'Yes. Every game has a practice mode against the Gamearn bot with no entry fee. Real-money games require a matchmaking entry fee from your wallet.',
      },
      {
        question: 'How does the streak work?',
        answer:
          'Play (or win) at least one game each day to grow your streak. Streaks are saved to your profile so they persist across devices. Miss a day and the streak resets, unless you recover it with the ad option.',
      },
    ],
  },
  {
    id: 'wallet',
    title: 'Wallet & Payments',
    items: [
      {
        question: 'How do I withdraw my balance?',
        answer:
          'Open Wallet > Withdraw, enter your Nigerian bank details and amount. For security you may be asked to re-authenticate. Withdrawals are processed and usually arrive within 24 hours.',
      },
      {
        question: 'What is the daily free bonus?',
        answer:
          'A small coin bonus you can claim once every 24 hours from the bonus button. Coins are practice currency used for friendly games — they are not real money and cannot be withdrawn.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account Recovery',
    items: [
      {
        question: 'I forgot my password.',
        answer:
          'On the login screen tap "Forgot Password" and enter your email. We will send you a reset link straight from Firebase, which lets you choose a new password.',
      },
      {
        question: 'How do I enable 2FA?',
        answer:
          'Go to Settings > Account Security. Choose email or phone as your factor, verify the code we send, and toggle 2FA on. Email 2FA works in the current build; phone 2FA uses SMS and is available in the full native build.',
      },
    ],
  },
];

const SECTION_ICONS = {
  games: Swords,
  wallet: Wallet,
  account: Key,
  support: LifeBuoy,
};

function titleCase(str) {
  if (!str) return '';
  return str
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export default function HelpSupportScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { signOut } = useAuth();
  const [sections, setSections] = useState(FALLBACK_SECTIONS);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const openDeleteModal = () => {
    setDeleteText('');
    setDeleteModal(true);
  };

  const handleDeleteAccount = async () => {
    if (deleteText.trim() !== 'DELETE') {
      Alert.alert('Confirmation required', 'Type DELETE to confirm account deletion.');
      return;
    }
    setDeleting(true);
    try {
      await auth.deleteAccount('DELETE');
      setDeleteModal(false);
      await signOut();
      navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
    } catch (err) {
      Alert.alert('Delete failed', err?.message || 'Could not delete your account.');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await content.help();
        if (mounted && Array.isArray(list) && list.length > 0) {
          setSections(list);
        }
      } catch {
        // Offline or server unreachable — fall back to local content.
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleItem = (secIdx, itemIdx) => {
    const key = `${secIdx}-${itemIdx}`;
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const items = sections.map((section, secIdx) => ({
    ...section,
    items: (section.items || []).map((item, itemIdx) => ({
      ...item,
      key: `${secIdx}-${itemIdx}`,
    })),
  }));

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
          style={[styles.backCircleBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}
        >
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Title Section */}
        <View style={styles.heroTitleBlock}>
          <Text style={styles.centerOpsLabel}>CENTER OF OPERATIONS</Text>
          <Text style={[styles.mainHeroTitle, { color: theme.textPrimary }]}>HOW CAN WE</Text>
          <Text style={styles.orangeHeroTitle}>HELP YOU?</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading help articles...</Text>
          </View>
        ) : (
          items.map((section, secIdx) => {
            const Icon = SECTION_ICONS[section.id] || LifeBuoy;
            const sectionTitle = titleCase(section.title);
            const numItems = (section.items || []).length;

            return (
              <View
                key={section.id || secIdx}
                style={[
                  styles.categoryCard,
                  { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle },
                ]}
              >
                {/* Category Header Row */}
                <View style={styles.categoryHeaderRow}>
                  <View style={styles.iconCircleCyan}>
                    <Icon size={22} color="#00E5FF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitleText, { color: theme.textPrimary }]}>
                      {sectionTitle.toUpperCase()}
                    </Text>
                    <Text style={[styles.cardSubText, { color: theme.textSecondary }]}>
                      {numItems} {numItems === 1 ? 'article' : 'articles'} available
                    </Text>
                  </View>
                </View>

                {/* FAQ Accordion List */}
                <View style={styles.faqListContainer}>
                  {section.items.map((item, itemIdx) => {
                    const itemKey = `${secIdx}-${itemIdx}`;
                    const open = !!expanded[itemKey];

                    return (
                      <View key={itemKey} style={[styles.faqItemCard, { borderColor: open ? theme.primary : 'rgba(255, 255, 255, 0.06)' }]}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => toggleItem(secIdx, itemIdx)}
                          style={styles.faqQuestionRow}
                        >
                          <Text style={[styles.faqQuestionText, { color: theme.textPrimary }]}>
                            {item.question || item.title || 'Topic'}
                          </Text>
                          <View style={[styles.chevronBadge, open && { backgroundColor: theme.primaryGlow }]}>
                            <ChevronDown
                              size={18}
                              color={open ? theme.primary : theme.textMuted}
                              style={open ? styles.faqChevronOpen : styles.faqChevronClosed}
                            />
                          </View>
                        </TouchableOpacity>

                        {open && (
                          <View style={[styles.faqAnswerContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)' }]}>
                            <Text style={[styles.faqAnswerText, { color: theme.textSecondary }]}>
                              {item.answer || item.body || 'No details available yet.'}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}

        {/* Still Need Help Contact Footer */}
        <View style={[styles.contactCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
          <LifeBuoy size={28} color="#FF5500" />
          <Text style={[styles.contactTitle, { color: theme.textPrimary }]}>STILL NEED HELP?</Text>
          <Text style={[styles.contactSubText, { color: theme.textSecondary }]}>
            Our support team is active 24/7 to assist with wallet, games, and account questions.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Settings'))}
            style={styles.contactBtn}
          >
            <Text style={styles.contactBtnText}>Back to Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Account Danger Zone */}
        <View style={[styles.dangerCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
          <View style={styles.dangerHeaderRow}>
            <View style={[styles.dangerIconSquare, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Trash2 size={20} color={theme.danger || '#EF4444'} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.dangerTitleText, { color: theme.textPrimary }]}>Account Actions</Text>
              <Text style={[styles.dangerSubText, { color: theme.textSecondary }]}>
                Permanently delete your Gamearn account and all associated data.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={openDeleteModal}
            style={styles.deleteAccountBtn}
          >
            <Trash2 size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.deleteAccountBtnText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Account Confirmation Modal */}
      <Modal visible={deleteModal} transparent animationType="fade" onRequestClose={() => setDeleteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Delete Account</Text>
              <TouchableOpacity onPress={() => setDeleteModal(false)} disabled={deleting}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalBody, { color: theme.textSecondary }]}>
              This permanently removes your profile, wallet, game history, ratings and tournament
              entries across Gamearn. It cannot be undone. Type DELETE to continue.
            </Text>
            <TextInput
              value={deleteText}
              onChangeText={setDeleteText}
              placeholder="Type DELETE"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!deleting}
              style={[
                styles.modalInput,
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary },
              ]}
            />
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={deleting || deleteText.trim() !== 'DELETE'}
              onPress={handleDeleteAccount}
              style={[
                styles.deleteConfirmBtn,
                (deleting || deleteText.trim() !== 'DELETE') && { opacity: 0.45 },
              ]}
            >
              {deleting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.deleteConfirmText}>Permanently Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroTitleBlock: {
    marginTop: 10,
    marginBottom: 24,
  },
  centerOpsLabel: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  mainHeroTitle: {
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 36,
  },
  orangeHeroTitle: {
    color: '#FF5500',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 38,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
  },
  categoryCard: {
    flexDirection: 'column',
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    marginBottom: 18,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 14,
  },
  iconCircleCyan: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleText: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardSubText: {
    fontSize: 12,
    marginTop: 2,
  },
  faqListContainer: {
    gap: 10,
  },
  faqItemCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  chevronBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqChevronClosed: {
    transform: [{ rotate: '0deg' }],
  },
  faqChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  faqAnswerContainer: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.15)',
  },
  faqAnswerText: {
    fontSize: 13,
    lineHeight: 20,
  },
  contactCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 6,
  },
  contactSubText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  contactBtn: {
    backgroundColor: '#FF5500',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  dangerCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  dangerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dangerIconSquare: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerTitleText: {
    fontSize: 16,
    fontWeight: '800',
  },
  dangerSubText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 13,
  },
  deleteAccountBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  deleteConfirmBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
