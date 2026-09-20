import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Circle,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

const LANGUAGES = [
  { id: 'es', name: 'Spanish', nativeName: 'Español' },
  { id: 'fr', name: 'French', nativeName: 'Français' },
  { id: 'de', name: 'German', nativeName: 'Deutsch' },
  { id: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { id: 'ja', name: 'Japanese', nativeName: '日本語' },
  { id: 'yo', name: 'Yoruba', nativeName: 'Èdè Yorùbá' },
  { id: 'ha', name: 'Hausa', nativeName: 'Harshen Hausa' },
  { id: 'ig', name: 'Igbo', nativeName: 'Asụsụ Igbo' },
];

export default function LanguageScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [selectedLang, setSelectedLang] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (id, name) => {
    setSelectedLang(id);
    Alert.alert('Language Updated 🌐', `App language set to ${name}.`);
  };

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
          style={[styles.backCircleBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}
        >
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Select Language</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always" keyboardDismissMode="none">
        {/* Search Input Box */}
        <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
          <Search size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search for a language"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        {/* Section: SUGGESTED */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>SUGGESTED</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleSelect('en', 'English (US)')}
            style={[styles.langCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }, selectedLang === 'en' && { borderColor: theme.primary, backgroundColor: isDark ? 'rgba(0, 229, 255, 0.08)' : 'rgba(0, 180, 216, 0.1)' }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.langName, { color: theme.textPrimary }]}>English (US)</Text>
              <Text style={[styles.langSub, { color: theme.textSecondary }]}>Default system language</Text>
            </View>
            <CheckCircle2 size={22} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Section: ALL LANGUAGES */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>ALL LANGUAGES</Text>
          {filteredLanguages.map((lang) => {
            const isSelected = selectedLang === lang.id;
            return (
              <TouchableOpacity
                key={lang.id}
                activeOpacity={0.85}
                onPress={() => handleSelect(lang.id, lang.name)}
                style={[styles.langCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }, isSelected && { borderColor: theme.primary, backgroundColor: isDark ? 'rgba(0, 229, 255, 0.08)' : 'rgba(0, 180, 216, 0.1)' }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.langName, { color: theme.textPrimary }]}>{lang.name}</Text>
                  <Text style={[styles.langSub, { color: theme.textSecondary }]}>{lang.nativeName}</Text>
                </View>
                {isSelected ? (
                  <CheckCircle2 size={22} color={theme.primary} />
                ) : (
                  <Circle size={22} color={theme.textMuted} />
                )}
              </TouchableOpacity>
            );
          })}
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
    paddingBottom: 40,
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
  },
  langCardActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
  },
  langName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  langSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
});
