import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Swords,
  Wallet,
  Key,
  LifeBuoy,
  ChevronDown,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { content } from '../../services/api';

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
  const [sections, setSections] = useState(FALLBACK_SECTIONS);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

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
            const isFirst = secIdx === 0;
            const sectionCardStyle = isFirst ? styles.categoryCardHero : styles.categoryCardRow;
            const sectionTitle = titleCase(section.title);
            return (
              <View
                key={section.id || secIdx}
                style={[sectionCardStyle, { backgroundColor: theme.cardBg, borderColor: isFirst ? theme.cardBorder : theme.cardBorderSubtle }]}
              >
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.iconCircleCyan, !isFirst && styles.iconCircleCyanSmall]}>
                    <Icon size={isFirst ? 24 : 20} color="#00E5FF" />
                  </View>
                  <View style={styles.rowLeftContent}>
                    <Text style={[styles.cardTitle, isFirst && styles.cardTitleSmall, { color: theme.textPrimary }]}>
                      {sectionTitle.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {section.items.slice(0, 5).map((item) => {
                  const open = !!expanded[item.key];
                  return (
                    <View key={item.key} style={styles.faqItem}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => toggleItem(secIdx, parseInt(item.key.split('-')[1], 10))}
                        style={styles.faqQuestionRow}
                      >
                        <Text style={[styles.faqQuestion, { color: theme.textPrimary }]}>
                          {item.question || item.title || 'Topic'}
                        </Text>
                        <ChevronDown size={18} color={theme.textMuted} style={[styles.faqChevron, open && styles.faqChevronOpen]} />
                      </TouchableOpacity>
                      {open && (
                        <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
                          {item.answer || item.body || 'No details available yet.'}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>
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
    marginBottom: 28,
  },
  centerOpsLabel: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  mainHeroTitle: {
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 38,
  },
  orangeHeroTitle: {
    color: '#FF5500',
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 40,
  },
  categoryCardHero: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  iconCircleCyan: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardSubText: {
    fontSize: 14,
    lineHeight: 20,
    maxWidth: '85%',
  },
  decorLinesPattern: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    gap: 6,
    transform: [{ rotate: '-45deg' }],
  },
  decorLineBar: {
    width: 50,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  categoryCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  rowLeftContent: {
    flex: 1,
    paddingRight: 10,
  },
  rowHeaderInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowTitleText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rowSubText: {
    fontSize: 12,
    lineHeight: 16,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconCircleCyanSmall: {
    width: 40,
    height: 40,
    borderRadius: 13,
    marginBottom: 0,
    marginRight: 12,
  },
  cardTitleSmall: {
    fontSize: 16,
    marginBottom: 0,
  },
  faqItem: {
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
    paddingVertical: 2,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 8,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  faqChevron: {
    transform: [{ rotate: '0deg' }],
  },
  faqChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 19,
    paddingBottom: 12,
  },
});
