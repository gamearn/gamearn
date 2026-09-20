import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { User, Phone, Gift, Gamepad2, Check } from 'lucide-react-native';
import GAButton from '../../components/GAButton';
import GAInput from '../../components/GAInput';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const GAMES = [
  { id: 'whot', name: 'Whot', icon: '🎴' },
  { id: 'ludo', name: 'Ludo', icon: '🎲' },
  { id: 'ayo', name: 'Ayo Olopon', icon: '🪵' },
  { id: 'draughts', name: 'Draughts', icon: '🏁' },
];

export default function ProfileSetupScreen({ navigation }) {
  const { theme } = useTheme();
  const { backendRegister, getPendingProfile } = useAuth();
  const pending = getPendingProfile() || {};
  const [username, setUsername] = useState(pending.displayName || '');
  const [phone, setPhone] = useState(pending.phoneNumber || '');
  const [phoneCode, setPhoneCode] = useState('+234');
  const [referralCode, setReferralCode] = useState('');
  const [favGame, setFavGame] = useState('whot');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!phone.trim()) {
      Alert.alert('Phone Number Required', 'We need your phone number to create your account.');
      return;
    }
    if (phone.length < 7) {
      Alert.alert('Invalid Phone Number', 'Enter a valid phone number, e.g. 0803 123 4567 or +234 803 123 4567.');
      return;
    }
    setLoading(true);
    try {
      await backendRegister({
        phoneNumber: phone.trim(),
        displayName: username.trim() || 'GameMaster',
        ...(referralCode.trim() ? { referralCode: referralCode.trim() } : {}),
      });
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (e) {
      Alert.alert('Registration Failed', e.message || 'Could not complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.bg }]}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="none"
    >
      <Text style={[styles.title, { color: theme.textPrimary }]}>Complete Profile</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Add your phone number & gamer handle to finish sign-up
      </Text>

      <View style={styles.fieldWrap}>
        <GAInput
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          placeholder="0803 123 4567"
          keyboardType="phone-pad"
          isPhone={true}
          phoneCode={phoneCode}
          onSelectPhoneCode={() =>
            Alert.alert('Country Code', 'Supported regions: +234 (Nigeria), +1 (USA), +44 (UK), +254 (Kenya)')
          }
          leftIcon={<Phone size={20} color={theme.textMuted} />}
        />
      </View>

      <View style={styles.fieldWrap}>
        <GAInput
          label="Gamertag / Username"
          value={username}
          onChangeText={setUsername}
          placeholder="e.g. MasterGamer99"
          leftIcon={<User size={20} color={theme.textMuted} />}
        />
      </View>

      <View style={styles.fieldWrap}>
        <GAInput
          label="Referral Code (optional)"
          value={referralCode}
          onChangeText={setReferralCode}
          placeholder="e.g. GAMERN123"
          autoCapitalize="characters"
          leftIcon={<Gift size={20} color={theme.textMuted} />}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        Select Favorite Game
      </Text>

      <View style={styles.grid}>
        {GAMES.map((g) => {
          const selected = favGame === g.id;
          return (
            <TouchableOpacity
              key={g.id}
              onPress={() => setFavGame(g.id)}
              style={[
                styles.gameCard,
                {
                  backgroundColor: selected ? theme.cardBg : theme.inputBg,
                  borderColor: selected ? theme.primary : theme.inputBorder,
                },
              ]}
            >
              <Text style={styles.emoji}>{g.icon}</Text>
              <Text style={[styles.gameName, { color: theme.textPrimary }]}>{g.name}</Text>
              {selected && <Check size={18} color={theme.primary} style={styles.checkIcon} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <GAButton
        title="Continue to Arena"
        onPress={handleSave}
        loading={loading}
        style={{ marginTop: 28 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 65,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  fieldWrap: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gameCard: {
    width: '47%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  gameName: {
    fontSize: 14,
    fontWeight: '700',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
