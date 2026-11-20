import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Circle,
  Globe,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { settings } from '../../services/api';

// Comprehensive Database of World Languages (Native scripts & English names)
const INITIAL_WORLD_LANGUAGES = [
  { id: 'en-US', name: 'English (US)', nativeName: 'English (United States)', region: 'Americas' },
  { id: 'en-GB', name: 'English (UK)', nativeName: 'English (United Kingdom)', region: 'Europe' },
  { id: 'es', name: 'Spanish', nativeName: 'Español', region: 'Americas / Europe' },
  { id: 'fr', name: 'French', nativeName: 'Français', region: 'Europe / Africa' },
  { id: 'de', name: 'German', nativeName: 'Deutsch', region: 'Europe' },
  { id: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', region: 'Asia' },
  { id: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', region: 'Asia' },
  { id: 'ja', name: 'Japanese', nativeName: '日本語', region: 'Asia' },
  { id: 'ko', name: 'Korean', nativeName: '한국어', region: 'Asia' },
  { id: 'yo', name: 'Yoruba', nativeName: 'Èdè Yorùbá', region: 'Africa' },
  { id: 'ha', name: 'Hausa', nativeName: 'Harshen Hausa', region: 'Africa' },
  { id: 'ig', name: 'Igbo', nativeName: 'Asụsụ Igbo', region: 'Africa' },
  { id: 'sw', name: 'Swahili', nativeName: 'Kiswahili', region: 'Africa' },
  { id: 'ar', name: 'Arabic', nativeName: 'العربية', region: 'Middle East / Africa' },
  { id: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'Asia' },
  { id: 'bn', name: 'Bengali', nativeName: 'বাংলা', region: 'Asia' },
  { id: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', region: 'Americas' },
  { id: 'pt-PT', name: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)', region: 'Europe' },
  { id: 'ru', name: 'Russian', nativeName: 'Русский', region: 'Europe / Asia' },
  { id: 'it', name: 'Italian', nativeName: 'Italiano', region: 'Europe' },
  { id: 'nl', name: 'Dutch', nativeName: 'Nederlands', region: 'Europe' },
  { id: 'pl', name: 'Polish', nativeName: 'Polski', region: 'Europe' },
  { id: 'tr', name: 'Turkish', nativeName: 'Türkçe', region: 'Europe / Asia' },
  { id: 'tl', name: 'Tagalog / Filipino', nativeName: 'Wikang Tagalog', region: 'Asia' },
  { id: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', region: 'Asia' },
  { id: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', region: 'Asia' },
  { id: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', region: 'Asia' },
  { id: 'th', name: 'Thai', nativeName: 'ไทย', region: 'Asia' },
  { id: 'fa', name: 'Persian / Farsi', nativeName: 'فارسی', region: 'Middle East' },
  { id: 'am', name: 'Amharic', nativeName: 'አማርኛ', region: 'Africa' },
  { id: 'zu', name: 'Zulu', nativeName: 'isiZulu', region: 'Africa' },
  { id: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', region: 'Africa' },
  { id: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', region: 'Africa' },
  { id: 'so', name: 'Somali', nativeName: 'Soomaali', region: 'Africa' },
  { id: 'el', name: 'Greek', nativeName: 'Ελληνικά', region: 'Europe' },
  { id: 'he', name: 'Hebrew', nativeName: 'עברית', region: 'Middle East' },
  { id: 'sv', name: 'Swedish', nativeName: 'Svenska', region: 'Europe' },
  { id: 'no', name: 'Norwegian', nativeName: 'Norsk', region: 'Europe' },
  { id: 'fi', name: 'Finnish', nativeName: 'Suomi', region: 'Europe' },
  { id: 'da', name: 'Danish', nativeName: 'Dansk', region: 'Europe' },
  { id: 'ro', name: 'Romanian', nativeName: 'Română', region: 'Europe' },
  { id: 'hu', name: 'Hungarian', nativeName: 'Magyar', region: 'Europe' },
  { id: 'cs', name: 'Czech', nativeName: 'Čeština', region: 'Europe' },
  { id: 'uk', name: 'Ukrainian', nativeName: 'Українська', region: 'Europe' },
  { id: 'sk', name: 'Slovak', nativeName: 'Slovenčina', region: 'Europe' },
  { id: 'bg', name: 'Bulgarian', nativeName: 'Български', region: 'Europe' },
  { id: 'hr', name: 'Croatian', nativeName: 'Hrvatski', region: 'Europe' },
  { id: 'sr', name: 'Serbian', nativeName: 'Српски', region: 'Europe' },
  { id: 'ca', name: 'Catalan', nativeName: 'Català', region: 'Europe' },
  { id: 'eu', name: 'Basque', nativeName: 'Euskara', region: 'Europe' },
  { id: 'gl', name: 'Galician', nativeName: 'Galego', region: 'Europe' },
  { id: 'cy', name: 'Welsh', nativeName: 'Cymraeg', region: 'Europe' },
  { id: 'ga', name: 'Irish Gaelic', nativeName: 'Gaeilge', region: 'Europe' },
  { id: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'Asia' },
  { id: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'Asia' },
  { id: 'mr', name: 'Marathi', nativeName: 'मराठी', region: 'Asia' },
  { id: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', region: 'Asia' },
  { id: 'ur', name: 'Urdu', nativeName: 'اردو', region: 'Asia' },
  { id: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'Asia' },
  { id: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'Asia' },
  { id: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', region: 'Asia' },
  { id: 'si', name: 'Sinhala', nativeName: 'සිංහල', region: 'Asia' },
  { id: 'my', name: 'Burmese', nativeName: 'မြန်မာဘာသာ', region: 'Asia' },
  { id: 'km', name: 'Khmer', nativeName: 'ភាសាខ្មែរ', region: 'Asia' },
  { id: 'lo', name: 'Lao', nativeName: 'ພາສາລາວ', region: 'Asia' },
  { id: 'ne', name: 'Nepali', nativeName: 'नेपाली', region: 'Asia' },
  { id: 'bo', name: 'Tibetan', nativeName: 'བོད་སྐད', region: 'Asia' },
  { id: 'mn', name: 'Mongolian', nativeName: 'Монгол', region: 'Asia' },
  { id: 'ka', name: 'Georgian', nativeName: 'ქართული', region: 'Europe / Asia' },
  { id: 'hy', name: 'Armenian', nativeName: 'Հայերեն', region: 'Europe / Asia' },
  { id: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan dili', region: 'Asia' },
  { id: 'kk', name: 'Kazakh', nativeName: 'Қазақ тілі', region: 'Asia' },
  { id: 'uz', name: 'Uzbek', nativeName: 'Oʻzbekcha', region: 'Asia' },
  { id: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча', region: 'Asia' },
  { id: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ', region: 'Asia' },
  { id: 'tk', name: 'Turkmen', nativeName: 'Türkmençe', region: 'Asia' },
  { id: 'ps', name: 'Pashto', nativeName: 'پښتو', region: 'Asia' },
  { id: 'ku', name: 'Kurdish', nativeName: 'Kurdî / کوردی', region: 'Middle East' },
  { id: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', region: 'Oceania' },
  { id: 'mi', name: 'Maori', nativeName: 'Te Reo Māori', region: 'Oceania' },
  { id: 'sm', name: 'Samoan', nativeName: 'Gagana Samoa', region: 'Oceania' },
  { id: 'fj', name: 'Fijian', nativeName: 'Vosa Vakaviti', region: 'Oceania' },
  { id: 'to', name: 'Tongan', nativeName: 'Lea Faka-Tonga', region: 'Oceania' },
  { id: 'mg', name: 'Malagasy', nativeName: 'Malagasy', region: 'Africa' },
  { id: 'eo', name: 'Esperanto', nativeName: 'Esperanto', region: 'International' },
  { id: 'la', name: 'Latin', nativeName: 'Lingua Latina', region: 'Historical' },
  { id: 'yi', name: 'Yiddish', nativeName: 'ייִדיש', region: 'Europe' },
  { id: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch', region: 'Europe' },
  { id: 'is', name: 'Icelandic', nativeName: 'Íslenska', region: 'Europe' },
  { id: 'sq', name: 'Albanian', nativeName: 'Shqip', region: 'Europe' },
  { id: 'mk', name: 'Macedonian', nativeName: 'Македонски', region: 'Europe' },
  { id: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', region: 'Europe' },
  { id: 'be', name: 'Belarusian', nativeName: 'Беларуская', region: 'Europe' },
  { id: 'et', name: 'Estonian', nativeName: 'Eesti', region: 'Europe' },
  { id: 'lv', name: 'Latvian', nativeName: 'Latviešu', region: 'Europe' },
  { id: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', region: 'Europe' },
  { id: 'mt', name: 'Maltese', nativeName: 'Malti', region: 'Europe' },
];

export default function LanguageScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [searchQuery, setSearchQuery] = useState('');
  const [languages, setLanguages] = useState(INITIAL_WORLD_LANGUAGES);
  const [loadingApi, setLoadingApi] = useState(false);

  // Hydrate the saved language preference from the server on mount.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await settings.get();
        if (mounted && res) {
          const saved = res.language || res.settings?.language || res.data?.language || res.data?.settings?.language;
          if (saved && typeof saved === 'string' && saved.length && saved.length <= 20) {
            setSelectedLang(saved);
          }
        }
      } catch {
        // Server unavailable — keep default.
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch Live Languages from API on Component Mount
  useEffect(() => {
    const fetchApiLanguages = async () => {
      try {
        setLoadingApi(true);
        const response = await fetch('https://libretranslate.com/languages');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const apiLangs = data.map((item) => ({
              id: item.code,
              name: item.name,
              nativeName: item.name,
              region: 'Global API',
            }));

            // Merge API languages with existing world database seamlessly
            setLanguages((prev) => {
              const existingIds = new Set(prev.map((l) => l.id.toLowerCase()));
              const newItems = apiLangs.filter((item) => !existingIds.has(item.id.toLowerCase()));
              return [...prev, ...newItems].sort((a, b) => a.name.localeCompare(b.name));
            });
          }
        }
      } catch (error) {
        // Fallback gracefully to offline world database
      } finally {
        setLoadingApi(false);
      }
    };

    fetchApiLanguages();
  }, []);

  const filteredLanguages = languages.filter((l) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      l.name.toLowerCase().includes(query) ||
      l.nativeName.toLowerCase().includes(query) ||
      l.id.toLowerCase().includes(query)
    );
  });

  const handleSelect = async (id, name) => {
    const previous = selectedLang;
    setSelectedLang(id);
    try {
      await settings.patch({ language: id });
    } catch (err) {
      setSelectedLang(previous);
      Alert.alert(
        'Could Not Save Language',
        err?.message || 'Your language preference could not be saved. Please try again.'
      );
      return;
    }
    Alert.alert('Language Saved', `App language preference saved as ${name}.`);
  };

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />

      {/* Header Navigation */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
          style={[styles.backCircleBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Select Language</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Input Box */}
        <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
          <Search size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search all languages on Earth (e.g. Yoruba, French, Spanish)..."
            placeholderTextColor={theme.textMuted}
          />
          {loadingApi && <ActivityIndicator size="small" color={theme.primary} style={{ marginLeft: 8 }} />}
        </View>

        {/* Section: SUGGESTED */}
        {!searchQuery && (
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>SUGGESTED</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleSelect('en-US', 'English (US)')}
              style={[
                styles.langCard,
                { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle },
                selectedLang === 'en-US' && {
                  borderColor: theme.primary,
                  backgroundColor: isDark ? 'rgba(0, 229, 255, 0.08)' : 'rgba(0, 180, 216, 0.1)',
                },
              ]}
            >
              <View style={[styles.langIconBox, { backgroundColor: 'rgba(0, 229, 255, 0.12)' }]}>
                <Globe size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.langName, { color: theme.textPrimary }]}>English (US)</Text>
                <Text style={[styles.langSub, { color: theme.textSecondary }]}>Default system language • Americas</Text>
              </View>
              <CheckCircle2 size={22} color={theme.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Section: ALL WORLD LANGUAGES */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              ALL WORLD LANGUAGES ({filteredLanguages.length})
            </Text>
          </View>

          {filteredLanguages.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No languages found matching "{searchQuery}"
              </Text>
            </View>
          ) : (
            filteredLanguages.map((lang) => {
              const isSelected = selectedLang === lang.id;
              return (
                <TouchableOpacity
                  key={lang.id}
                  activeOpacity={0.85}
                  onPress={() => handleSelect(lang.id, lang.name)}
                  style={[
                    styles.langCard,
                    { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle },
                    isSelected && {
                      borderColor: theme.primary,
                      backgroundColor: isDark ? 'rgba(0, 229, 255, 0.08)' : 'rgba(0, 180, 216, 0.1)',
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.langTitleRow}>
                      <Text style={[styles.langName, { color: theme.textPrimary }]}>{lang.name}</Text>
                      <View style={[styles.codeBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}>
                        <Text style={[styles.codeBadgeText, { color: theme.textMuted }]}>{lang.id.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={[styles.langSub, { color: theme.textSecondary }]}>
                      {lang.nativeName} {lang.region ? `• ${lang.region}` : ''}
                    </Text>
                  </View>

                  {isSelected ? (
                    <CheckCircle2 size={22} color={theme.primary} />
                  ) : (
                    <Circle size={22} color={theme.textMuted} />
                  )}
                </TouchableOpacity>
              );
            })
          )}
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
    paddingBottom: 320,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  sectionWrap: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  langIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  codeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  langSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
