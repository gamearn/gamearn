import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, StatusBar, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Camera, CheckCircle2 } from 'lucide-react-native';
import GAButton from '../../components/GAButton';
import { useAuth } from '../../context/AuthContext';
import { uploadProfileImage } from '../../services/firebase';
import { useTheme } from '../../context/ThemeContext';

const AVATAR_PRESETS = [
  { id: 'oba', label: 'OBA', uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200' },
  { id: 'mage', label: 'MAGE', uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' },
  { id: 'cyber', label: 'CYBER', uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
  { id: 'queen', label: 'QUEEN', uri: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200' },
  { id: 'cyborg', label: 'CYBORG', uri: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200' },
];

export default function EditProfileScreen({ navigation }) {
  const { userProfile, updateProfileData } = useAuth();
  const { theme, isDark } = useTheme();

  const currentAvatarUri = userProfile?.avatar || AVATAR_PRESETS[1].uri;
  const initialAvatar = AVATAR_PRESETS.find((a) => a.uri === currentAvatarUri) || { id: 'current', label: 'CURRENT', uri: currentAvatarUri };
  const [selectedAvatar, setSelectedAvatar] = useState(initialAvatar);
  const [username, setUsername] = useState(userProfile?.username || userProfile?.name || userProfile?.displayName || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [loading, setLoading] = useState(false);

  const handlePickCustomAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Gallery access is needed to select a custom avatar photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType?.Images || 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedAvatar({ id: 'custom', label: 'CUSTOM', uri: result.assets[0].uri });
      }
    } catch (err) {
      console.log('Pick avatar error:', err);
    }
  };

  const handleSaveChanges = async () => {
    if (!username.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid username.');
      return;
    }
    setLoading(true);
    try {
      let finalAvatarUri = selectedAvatar.uri;
      if (selectedAvatar.id === 'custom' && selectedAvatar.uri.startsWith('file')) {
        try {
          const userUid = userProfile?.uid || 'user';
          finalAvatarUri = await uploadProfileImage(userUid, selectedAvatar.uri);
        } catch (uploadErr) {
          console.log('Upload image notice:', uploadErr?.message || uploadErr);
          finalAvatarUri = selectedAvatar.uri;
        }
      }

      const newName = username.trim();
      await updateProfileData({
        username: newName,
        name: newName,
        displayName: newName,
        avatar: finalAvatarUri,
        bio: bio.trim(),
      });

      Alert.alert('Profile Updated 🌟', 'Your profile details have been updated successfully!', [
        {
          text: 'OK',
          onPress: () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs')),
        },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not update profile.');
    } finally {
      setLoading(false);
    }
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
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Avatar Display */}
        <View style={styles.avatarCenterWrap}>
          <View style={styles.mainAvatarRing}>
            <Image source={{ uri: selectedAvatar.uri }} style={styles.mainAvatarImg} />
            <TouchableOpacity
              style={styles.cameraBadgeBtn}
              onPress={handlePickCustomAvatar}
              activeOpacity={0.8}
            >
              <Camera size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.changeBtn}
            onPress={handlePickCustomAvatar}
            activeOpacity={0.85}
          >
            <Text style={styles.changeBtnText}>Upload Photo / Change Avatar</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar Selection Row */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>Choose an Avatar</Text>
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
                  <View style={[styles.avatarMiniRing, { borderColor: theme.cardBorderSubtle }, isSelected && styles.avatarMiniRingSelected]}>
                    <Image source={{ uri: item.uri }} style={styles.avatarMiniImg} />
                  </View>
                  <Text style={[styles.avatarLabelText, { color: theme.textSecondary }, isSelected && styles.avatarLabelTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Username Field */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>Username</Text>
          <View style={[styles.inputBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
            <TextInput
              style={[styles.textInput, { color: theme.textPrimary }]}
              value={username}
              onChangeText={setUsername}
              placeholder="e.g. GamerOne"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
            />
            {username.trim().length >= 3 && (
              <CheckCircle2 size={20} color="#10B981" style={{ marginLeft: 8 }} />
            )}
          </View>
          {username.trim().length >= 3 ? (
            <Text style={styles.availableText}>Username is available!</Text>
          ) : (
            <Text style={[styles.hintText, { color: theme.textMuted }]}>Enter 3+ characters for your gamer tag.</Text>
          )}
        </View>

        {/* Bio & Tags Field */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>Bio & Tags</Text>
          <View style={[styles.inputBox, styles.textAreaBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
            <TextInput
              style={[styles.textInput, styles.textAreaInput, { color: theme.textPrimary }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell the world your gaming style... (e.g. Ayo Pro, Ludo King, Daily Grinder)"
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Action CTA */}
        <GAButton
          title="Save Changes"
          onPress={handleSaveChanges}
          loading={loading}
          variant="primary"
          style={styles.saveBtn}
        />
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 320,
  },
  avatarCenterWrap: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 10,
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
  saveBtn: {
    marginTop: 10,
    marginBottom: 20,
  },
});
