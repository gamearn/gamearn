import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Camera, CheckCircle2 } from 'lucide-react-native';
import GAButton from '../../components/GAButton';
import { useAuth } from '../../context/AuthContext';

const AVATAR_PRESETS = [
  { id: 'oba', label: 'OBA', uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200' },
  { id: 'mage', label: 'MAGE', uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' },
  { id: 'cyber', label: 'CYBER', uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
  { id: 'queen', label: 'QUEEN', uri: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200' },
  { id: 'cyborg', label: 'CYBORG', uri: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200' },
];

export default function ProfileCreationScreen({ navigation }) {
  const { updateProfileData, userProfile } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[1]);
  const [username, setUsername] = useState(userProfile?.username || 'GamerOne');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (isSkip = false) => {
    setLoading(true);
    try {
      await updateProfileData({
        username: isSkip ? (username || 'GamerOne') : (username.trim() || 'GamerOne'),
        avatar: selectedAvatar.uri,
        bio: isSkip ? '' : bio.trim(),
        profileCompleted: true,
      });
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (e) {
      Alert.alert('Profile Error', e.message || 'Could not save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle="light-content" backgroundColor="#070C1B" />
      <LinearGradient colors={['#091026', '#060919', '#040612']} style={StyleSheet.absoluteFillObject} />

      {/* Top Header Navigation */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Register'))}
          style={styles.backCircleBtn}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Text style={styles.pageTitle}>Create Your Identity</Text>

        {/* Hero Avatar Display */}
        <View style={styles.avatarCenterWrap}>
          <View style={styles.mainAvatarRing}>
            <Image source={{ uri: selectedAvatar.uri }} style={styles.mainAvatarImg} />
            <TouchableOpacity style={styles.cameraBadgeBtn} activeOpacity={0.8}>
              <Camera size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.changeBtn}
            onPress={() => {
              const nextIndex = (AVATAR_PRESETS.findIndex((a) => a.id === selectedAvatar.id) + 1) % AVATAR_PRESETS.length;
              setSelectedAvatar(AVATAR_PRESETS[nextIndex]);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.changeBtnText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar Selection Row */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>Choose an Avatar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarsRow}>
            {AVATAR_PRESETS.map((item) => {
              const isSelected = selectedAvatar.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedAvatar(item)}
                  style={styles.avatarChoiceWrap}
                  activeOpacity={0.8}
                >
                  <View style={[styles.avatarMiniRing, isSelected && styles.avatarMiniRingSelected]}>
                    <Image source={{ uri: item.uri }} style={styles.avatarMiniImg} />
                  </View>
                  <Text style={[styles.avatarLabelText, isSelected && styles.avatarLabelTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Username Field */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>Username</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={username}
              onChangeText={setUsername}
              placeholder="e.g. GamerOne"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
            />
            {username.trim().length >= 3 && (
              <CheckCircle2 size={20} color="#10B981" style={{ marginLeft: 8 }} />
            )}
          </View>
          {username.trim().length >= 3 ? (
            <Text style={styles.availableText}>Username is available!</Text>
          ) : (
            <Text style={styles.hintText}>Enter 3+ characters for your gamer tag.</Text>
          )}
        </View>

        {/* Bio & Tags Field */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>Bio & Tags</Text>
          <View style={[styles.inputBox, styles.textAreaBox]}>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell the world your gaming style... (e.g. Ayo Pro, Ludo King, Daily Grinder)"
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Action CTA */}
        <GAButton
          title="Get Started 🚀"
          onPress={() => handleSave(false)}
          loading={loading}
          variant="primary"
          style={styles.getStartedBtn}
        />

        {/* Skip Link */}
        <TouchableOpacity onPress={() => handleSave(true)} style={styles.skipBtn} activeOpacity={0.8}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 10,
    zIndex: 10,
    alignItems: 'flex-start',
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 320,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  avatarCenterWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  mainAvatarRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#FF5500',
    padding: 4,
    position: 'relative',
    marginBottom: 16,
    shadowColor: '#FF5500',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  mainAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 65,
  },
  cameraBadgeBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FF5500',
    borderWidth: 2,
    borderColor: '#070C1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeBtn: {
    backgroundColor: '#FF5500',
    borderRadius: 14,
    paddingHorizontal: 36,
    paddingVertical: 10,
    shadowColor: '#FF5500',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  changeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  sectionWrap: {
    marginBottom: 22,
  },
  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  avatarsRow: {
    gap: 16,
    paddingRight: 10,
  },
  avatarChoiceWrap: {
    alignItems: 'center',
  },
  avatarMiniRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 2,
    marginBottom: 6,
  },
  avatarMiniRingSelected: {
    borderColor: '#FF5500',
    shadowColor: '#FF5500',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarMiniImg: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  avatarLabelText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
  },
  avatarLabelTextSelected: {
    color: '#FF5500',
    fontWeight: '900',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  textAreaBox: {
    paddingVertical: 12,
    minHeight: 110,
  },
  textAreaInput: {
    height: 90,
  },
  availableText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  hintText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 6,
  },
  getStartedBtn: {
    marginTop: 10,
    marginBottom: 16,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
});
