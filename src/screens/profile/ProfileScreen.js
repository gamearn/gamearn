import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Flame } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileScreen({ navigation }) {
  const { userProfile } = useAuth();
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const name = userProfile?.username || userProfile?.displayName || 'Gamer';
  const initials = name.slice(0, 1).toUpperCase();
  return <View style={[styles.root, { backgroundColor: theme.bg }]}>
    <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
    <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs')} style={[styles.back, { backgroundColor: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)' }]}><ArrowLeft size={20} color={theme.textPrimary} /></TouchableOpacity>
      <Text style={[styles.title, { color: theme.textPrimary }]}>My Profile</Text><View style={{ width: 40 }} />
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.avatar}>{userProfile?.avatar ? <Image source={{ uri: userProfile.avatar }} style={styles.avatarImage} /> : <Text style={[styles.initial, { color: theme.textPrimary }]}>{initials}</Text>}</View>
        <Text style={[styles.name, { color: theme.textPrimary }]}>{name}</Text>
        {!!userProfile?.bio && <Text style={[styles.bio, { color: theme.textSecondary }]}>{userProfile.bio}</Text>}
      </View>
      <View style={styles.actions}><TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.primary}><Text style={styles.primaryText}>Edit Profile</Text></TouchableOpacity><TouchableOpacity onPress={() => navigation.navigate('WalletTab')} style={[styles.secondary, { borderColor: theme.cardBorderSubtle }]}><Text style={[styles.secondaryText, { color: theme.textPrimary }]}>Wallet</Text></TouchableOpacity></View>
      <View style={styles.stats}>
        <Stat label="FOLLOWERS" value={userProfile?.followers ?? '—'} theme={theme} />
        <Stat label="FOLLOWING" value={userProfile?.following ?? '—'} theme={theme} />
        <TouchableOpacity onPress={() => navigation.navigate('DailyStreak')} style={[styles.stat, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}><View style={styles.streak}><Flame size={15} color={theme.primary} /><Text style={[styles.value, { color: theme.primary }]}>{userProfile?.streak ?? 0}</Text></View><Text style={[styles.label, { color: theme.primary }]}>DAY STREAK</Text></TouchableOpacity>
      </View>
      <View style={[styles.search, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}><TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Search Friends" placeholderTextColor={theme.textMuted} style={[styles.input, { color: theme.textPrimary }]} /></View>
      <Text style={[styles.section, { color: theme.textSecondary }]}>ACTIVE FRIENDS <Text style={{ fontWeight: '400' }}>· No friends yet</Text></Text>
      <Text style={[styles.empty, { color: theme.textSecondary }]}>Connect with players during games to see friends here.</Text>
    </ScrollView>
  </View>;
}
function Stat({ label, value, theme }) { return <View style={[styles.stat, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}><Text style={[styles.value, { color: theme.textPrimary }]}>{value}</Text><Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text></View>; }
const styles = StyleSheet.create({ root:{flex:1},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingTop:60,paddingBottom:15},back:{width:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center'},title:{fontSize:22,fontWeight:'800'},content:{padding:20,paddingBottom:100},hero:{alignItems:'center',marginBottom:20},avatar:{width:110,height:110,borderRadius:55,borderWidth:3,borderColor:'#FF5500',alignItems:'center',justifyContent:'center',marginBottom:12},avatarImage:{width:'100%',height:'100%',borderRadius:55},initial:{fontSize:42,fontWeight:'800'},name:{fontSize:24,fontWeight:'900'},bio:{fontSize:14,marginTop:6,textAlign:'center'},actions:{flexDirection:'row',gap:12,marginBottom:20},primary:{flex:1,backgroundColor:'#FF5500',borderRadius:14,padding:14,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'900'},secondary:{flex:1,borderWidth:1,borderRadius:14,padding:14,alignItems:'center'},secondaryText:{fontWeight:'800'},stats:{flexDirection:'row',gap:10,marginBottom:20},stat:{flex:1,borderWidth:1,borderRadius:16,padding:14,alignItems:'center'},value:{fontSize:20,fontWeight:'900'},label:{fontSize:10,fontWeight:'800',marginTop:4},streak:{flexDirection:'row',alignItems:'center',gap:3},search:{borderWidth:1,borderRadius:24,paddingHorizontal:16,marginBottom:20},input:{paddingVertical:12},section:{fontSize:11,fontWeight:'900',letterSpacing:1},empty:{textAlign:'center',paddingVertical:28,fontSize:14}}
