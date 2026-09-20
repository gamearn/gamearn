import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, StatusBar, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Camera } from 'lucide-react-native';
import GAButton from '../../components/GAButton';
import { useAuth } from '../../context/AuthContext';
import { uploadProfileImage } from '../../services/firebase';
import { useTheme } from '../../context/ThemeContext';

export default function EditProfileScreen({ navigation }) {
  const { user, userProfile, updateProfileData } = useAuth(); const { theme, isDark } = useTheme();
  const [username, setUsername] = useState(userProfile?.username || ''); const [bio, setBio] = useState(userProfile?.bio || '');
  const [avatar, setAvatar] = useState(userProfile?.avatar || ''); const [loading, setLoading] = useState(false);
  const choosePhoto = async () => { const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!permission.granted) { Alert.alert('Permission needed', 'Allow photo access to choose a profile picture.'); return; } const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1,1], quality: .85 }); if (!result.canceled) setAvatar(result.assets[0].uri); };
  const save = async () => { if (username.trim().length < 3) { Alert.alert('Invalid username', 'Use at least 3 characters.'); return; } setLoading(true); try { let uploaded = avatar; if (avatar && !avatar.startsWith('http')) uploaded = await uploadProfileImage(user.uid, avatar); await updateProfileData({ username: username.trim(), avatar: uploaded, bio: bio.trim() }); Alert.alert('Profile updated', 'Your profile has been saved.', [{ text: 'OK', onPress: () => navigation.goBack() }]); } catch (e) { Alert.alert('Could not save profile', e.message || 'Please try again.'); } finally { setLoading(false); } };
  return <View style={[styles.root, { backgroundColor: theme.bg }]}><StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} /><LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />
    <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()} style={[styles.back, { backgroundColor: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)' }]}><ArrowLeft size={20} color={theme.textPrimary} /></TouchableOpacity><Text style={[styles.title, { color: theme.textPrimary }]}>Edit Profile</Text><View style={{ width: 40 }} /></View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="always"><View style={styles.avatarWrap}>{avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : <Text style={[styles.initial, { color: theme.textPrimary }]}>{(username || 'G').slice(0,1).toUpperCase()}</Text>}<TouchableOpacity onPress={choosePhoto} style={styles.camera}><Camera size={16} color="#fff" /></TouchableOpacity></View><TouchableOpacity onPress={choosePhoto}><Text style={styles.change}>Choose profile picture</Text></TouchableOpacity>
      <Text style={[styles.label, { color: theme.textPrimary }]}>Username</Text><TextInput value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="Your unique gamer tag" placeholderTextColor={theme.textMuted} style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]} />
      <Text style={[styles.label, { color: theme.textPrimary }]}>Bio</Text><TextInput value={bio} onChangeText={setBio} multiline placeholder="Tell players about you" placeholderTextColor={theme.textMuted} style={[styles.input, styles.bio, { color: theme.textPrimary, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]} />
      <GAButton title="Save Changes" onPress={save} loading={loading} style={{ marginTop: 20 }} />
    </ScrollView></View>;
}
const styles=StyleSheet.create({root:{flex:1},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:20,paddingTop:60},back:{width:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center'},title:{fontSize:22,fontWeight:'800'},content:{padding:24,paddingBottom:50},avatarWrap:{alignSelf:'center',width:140,height:140,borderRadius:70,borderWidth:3,borderColor:'#FF5500',alignItems:'center',justifyContent:'center',position:'relative'},avatar:{width:'100%',height:'100%',borderRadius:70},initial:{fontSize:52,fontWeight:'800'},camera:{position:'absolute',right:2,bottom:2,width:36,height:36,borderRadius:18,backgroundColor:'#FF5500',alignItems:'center',justifyContent:'center'},change:{textAlign:'center',color:'#FF5500',fontWeight:'800',marginVertical:18},label:{fontWeight:'800',marginTop:14,marginBottom:8},input:{borderWidth:1,borderRadius:14,padding:14,fontSize:16},bio:{minHeight:110,textAlignVertical:'top'}});
