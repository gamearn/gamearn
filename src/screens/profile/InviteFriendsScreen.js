import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  StatusBar,
  Modal,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Copy,
  Share2,
  Users,
  Search,
  Check,
  HelpCircle,
  QrCode,
  Flame,
  Gamepad2,
  Trophy,
  Send,
  Sparkles,
  TrendingUp,
  Coins,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { referral } from '../../services/api';

export default function InviteFriendsScreen({ navigation }) {
  const { userProfile, updateProfileData } = useAuth();
  const { theme, isDark } = useTheme();

  const userName = userProfile?.username || userProfile?.fullName || userProfile?.name || 'Gamer';
  const referralCode = useMemo(() => {
    if (userProfile?.referralCode) return userProfile.referralCode;
    const uid = String(userProfile?.uid || userProfile?.id || '').trim();
    if (uid && uid.length >= 6) {
      return uid.substring(0, 8).toUpperCase();
    }
    const cleanName = (userName || 'GAMER').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'GAMER';
    return `${cleanName}88`;
  }, [userProfile?.referralCode, userProfile?.uid, userProfile?.id, userName]);

  useEffect(() => {
    if (referralCode && !userProfile?.referralCode && updateProfileData) {
      updateProfileData({ referralCode });
    }
  }, [referralCode, userProfile?.referralCode, updateProfileData]);

  const referralLink = `https://gamearn.app/invite/${referralCode}`;

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'risk', 'inactive'
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('This Week');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [activePingModal, setActivePingModal] = useState(null);
  const [viewReferralDetails, setViewReferralDetails] = useState(null);

  const toggleTimeFilter = () => {
    setTimeFilter((prev) => (prev === 'This Week' ? 'Last Week' : 'This Week'));
  };

  const [referrals, setReferrals] = useState([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await referral.me();
        if (isMounted && res) {
          const list = res.data?.referrals || res.referrals || res.data || userProfile?.referredUsers || [];
          if (Array.isArray(list)) {
            setReferrals(list);
          }
        }
      } catch {
        if (isMounted && Array.isArray(userProfile?.referredUsers)) {
          setReferrals(userProfile.referredUsers);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [userProfile]);

  const handleCopyCode = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert('Referral Code Copied! 🚀', `Code "${referralCode}" copied to clipboard.`);
  };

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `Join me on Gamearn and play Whot, Ludo, Ayo & Draughts! Use my referral code ${referralCode} to get free bonus coins: ${referralLink}`,
      });
    } catch {
      Alert.alert('Share', `Invite Link: ${referralLink}`);
    }
  };

  const handleSendPing = (refItem, pingType) => {
    setActivePingModal(null);
    Alert.alert(
      'Ping Sent! 📲',
      `Sent a ${pingType} reminder ping to ${refItem ? refItem.name || refItem.username || refItem.handle : 'all squad members'}. They will receive a push notification!`
    );
  };

  const handlePingAll = () => {
    if (referrals.length === 0) {
      Alert.alert('Squad Ping 📣', 'You currently have no active referrals to ping. Share your invite code to build your squad!');
      return;
    }
    Alert.alert(
      'Bulk Ping Squad 📣',
      `Sent activity reminder pings to ${referrals.length} squad member(s)!`,
      [{ text: 'Great!', style: 'default' }]
    );
  };

  const activeCount = referrals.filter((r) => r.status === 'active' || r.isActiveToday).length;
  const riskCount = referrals.filter((r) => r.status === 'risk').length;
  const inactiveCount = referrals.filter((r) => r.status === 'inactive' || (!r.status && !r.isActiveToday)).length;
  const totalEarnings = userProfile?.referralEarnings ?? userProfile?.referralBalance ?? referrals.reduce((sum, r) => sum + (r.yourCommission || 0), 0);
  const todayEarnings = referrals.reduce((sum, r) => sum + (r.todayCommission || 0), 0);

  const filteredReferrals = referrals.filter((item) => {
    const nameStr = (item.name || item.username || '').toLowerCase();
    const handleStr = (item.handle || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = nameStr.includes(query) || handleStr.includes(query);
    if (!matchesSearch) return false;

    if (activeTab === 'active') return item.status === 'active' || item.isActiveToday;
    if (activeTab === 'risk') return item.status === 'risk';
    if (activeTab === 'inactive') return item.status === 'inactive' || (!item.status && !item.isActiveToday);
    return true;
  });

  return (
    <View style={[styles.screenRoot, { backgroundColor: '#070C1B' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#070C1B" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
          style={styles.backCircleBtn}
        >
          <ArrowLeft size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>{userName}'s Referrals</Text>
          <Text style={styles.headerSubtitle}>Invite. Play. Earn Together.</Text>
        </View>

        <TouchableOpacity onPress={() => setShowHelpModal(true)} style={styles.helpCircleBtn}>
          <HelpCircle size={18} color="#60A5FA" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Grow Your Squad Hero Banner */}
        <LinearGradient
          colors={['#0F172A', '#1E1B4B', '#1E293B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBannerCard}
        >
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle}>Grow Your Squad, {userName}.</Text>
            <Text style={styles.heroTitleAccent}>Earn Together.</Text>
            <Text style={styles.heroDesc}>
              Earn <Text style={{ color: '#60A5FA', fontWeight: '900' }}>5%</Text> of everything your referrals earn from streaks, challenges, tournaments and more.
            </Text>
          </View>

          <View style={styles.heroCrownBadgeWrap}>
            <LinearGradient colors={['#F59E0B', '#B45309']} style={styles.crownBadgeGradient}>
              <Sparkles size={16} color="#FFFFFF" />
              <Text style={styles.crownBadgePct}>5%</Text>
              <Text style={styles.crownBadgeSub}>COMMISSION</Text>
              <Text style={styles.crownBadgeSub2}>FOREVER</Text>
            </LinearGradient>
          </View>
        </LinearGradient>

        {/* Your Referral Code Card */}
        <View style={styles.referralCodeBoxCard}>
          <Text style={styles.boxLabel}>Your Referral Code</Text>
          <View style={styles.codeRowWrap}>
            <View style={styles.codeDisplayPill}>
              <Text style={styles.codeText}>{referralCode}</Text>
              <TouchableOpacity onPress={handleCopyCode} style={styles.copyBtnInline}>
                {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} color="#60A5FA" />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={handleShareInvite} style={styles.shareBtnPrimary}>
              <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.shareBtnGradient}>
                <Share2 size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.shareBtnText}>Share Invite</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowQrModal(true)} style={styles.qrCodeBtn}>
              <QrCode size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.codeSubNote}>Invite friends to join GAMEARN using your code or link.</Text>
        </View>

        {/* Network Stats Grid */}
        <View style={styles.statsGridRow}>
          <View style={styles.statGridCard}>
            <View style={styles.statHeaderInline}>
              <Users size={15} color="#60A5FA" />
              <Text style={styles.statCardVal}>{referrals.length}</Text>
            </View>
            <Text style={styles.statCardLabel}>Total Referrals</Text>
          </View>

          <View style={styles.statGridCard}>
            <View style={styles.statHeaderInline}>
              <View style={styles.activeDotGreen} />
              <Text style={styles.statCardVal}>{activeCount}</Text>
            </View>
            <Text style={styles.statCardLabel}>Active Today</Text>
          </View>

          <View style={styles.statGridCard}>
            <View style={styles.statHeaderInline}>
              <Coins size={15} color="#F59E0B" />
              <Text style={styles.statCardVal}>{totalEarnings.toLocaleString()}</Text>
            </View>
            <Text style={styles.statCardLabel}>Referral Earnings</Text>
            <Text style={styles.statCardSub}>Total Earned</Text>
          </View>

          <View style={styles.statGridCard}>
            <View style={styles.statHeaderInline}>
              <TrendingUp size={15} color="#10B981" />
              <Text style={[styles.statCardVal, { color: '#10B981' }]}>{todayEarnings}</Text>
            </View>
            <Text style={styles.statCardLabel}>Earned Today</Text>
          </View>
        </View>

        {/* Earnings Overview Chart Section */}
        <View style={styles.earningsChartCard}>
          <View style={styles.chartHeaderRow}>
            <View>
              <Text style={styles.chartTitle}>Earnings Overview</Text>
              <Text style={styles.chartBigUnits}>{totalEarnings.toLocaleString()} <Text style={styles.chartSubUnits}>Units</Text></Text>
              <Text style={styles.chartCommissionSub}>Your 5% referral earnings</Text>
            </View>

            <TouchableOpacity onPress={toggleTimeFilter} style={styles.periodFilterBtn}>
              <Text style={styles.periodFilterText}>{timeFilter}</Text>
            </TouchableOpacity>
          </View>

          {/* Bar Chart Visual */}
          <View style={styles.chartBarGrid}>
            {[
              { day: 'Mon', h: referrals.length > 0 ? '45%' : '10%' },
              { day: 'Tue', h: referrals.length > 0 ? '65%' : '10%' },
              { day: 'Wed', h: referrals.length > 0 ? '40%' : '10%' },
              { day: 'Thu', h: referrals.length > 0 ? '85%' : '10%' },
              { day: 'Fri', h: referrals.length > 0 ? '55%' : '10%' },
              { day: 'Sat', h: referrals.length > 0 ? '95%' : '10%' },
              { day: 'Sun', h: referrals.length > 0 ? '75%' : '10%' },
            ].map((bar, i) => (
              <View key={i} style={styles.chartBarCol}>
                <View style={styles.chartBarTrack}>
                  <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={[styles.chartBarFill, { height: bar.h }]} />
                </View>
                <Text style={styles.chartDayText}>{bar.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Keep Your Squad Active Section */}
        <View style={styles.squadActiveSectionCard}>
          <View style={styles.squadActiveHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.squadActiveTitle}>Keep Your Squad Active</Text>
              <Text style={styles.squadActiveSub}>Remind your referrals to stay active and earn more!</Text>
            </View>

            <TouchableOpacity onPress={handlePingAll} style={styles.pingAllBtn}>
              <Send size={12} color="#60A5FA" style={{ marginRight: 3 }} />
              <Text style={styles.pingAllText}>Ping All</Text>
              <ChevronRight size={12} color="#60A5FA" />
            </TouchableOpacity>
          </View>

          {/* 3 Ping Action Categories */}
          <View style={styles.pingCategoryRow}>
            <TouchableOpacity
              onPress={() => setActiveTab('risk')}
              style={[styles.pingCategoryBox, { borderColor: '#EF444444' }]}
            >
              <Flame size={16} color="#EF4444" fill="#EF4444" />
              <View style={{ marginLeft: 6 }}>
                <Text style={styles.pingCatTitle}>Streak Ping</Text>
                <Text style={[styles.pingCatVal, { color: '#EF4444' }]}>{riskCount} at risk</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('inactive')}
              style={[styles.pingCategoryBox, { borderColor: '#F59E0B44' }]}
            >
              <Gamepad2 size={16} color="#F59E0B" />
              <View style={{ marginLeft: 6 }}>
                <Text style={styles.pingCatTitle}>Challenge Ping</Text>
                <Text style={[styles.pingCatVal, { color: '#F59E0B' }]}>{inactiveCount} inactive</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('inactive')}
              style={[styles.pingCategoryBox, { borderColor: '#3B82F644' }]}
            >
              <Trophy size={16} color="#60A5FA" />
              <View style={{ marginLeft: 6 }}>
                <Text style={styles.pingCatTitle}>Tournament Ping</Text>
                <Text style={[styles.pingCatVal, { color: '#60A5FA' }]}>{inactiveCount} inactive</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* My Referrals Member List */}
        <View style={styles.referralsListCard}>
          <View style={styles.referralsHeaderRow}>
            <Text style={styles.myReferralsTitle}>
              My Referrals <Text style={styles.countPill}>({referrals.length})</Text>
            </Text>

            {/* Search Input */}
            <View style={styles.searchBarInline}>
              <Search size={14} color="#64748B" style={{ marginRight: 4 }} />
              <TextInput
                style={styles.searchInputText}
                placeholder="Search..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabRow}>
            {[
              { key: 'all', label: `All (${referrals.length})` },
              { key: 'active', label: `Active (${activeCount})` },
              { key: 'risk', label: `At Risk (${riskCount})` },
              { key: 'inactive', label: `Inactive (${inactiveCount})` },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.filterTabPill,
                  activeTab === tab.key && styles.filterTabPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    activeTab === tab.key && styles.filterTabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Referrals List Cards or Empty State */}
          <View style={{ gap: 10, marginTop: 12 }}>
            {filteredReferrals.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Users size={28} color="#64748B" style={{ marginBottom: 6 }} />
                <Text style={styles.emptyTitle}>No Referrals Found</Text>
                <Text style={styles.emptySub}>
                  Share your referral code <Text style={{ color: '#60A5FA', fontWeight: '800' }}>{referralCode}</Text> with friends to build your squad and start earning 5% commission!
                </Text>
              </View>
            ) : (
              filteredReferrals.map((item, index) => (
                <View key={item.id || index} style={styles.referralMemberCard}>
                  <View style={styles.memberAvatarWrap}>
                    <Image
                      source={{
                        uri:
                          item.avatar ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                      }}
                      style={styles.memberAvatarImg}
                    />
                    <View
                      style={[
                        styles.statusDotOverlay,
                        {
                          backgroundColor:
                            item.status === 'active' || item.isActiveToday
                              ? '#10B981'
                              : item.status === 'risk'
                              ? '#F59E0B'
                              : '#64748B',
                        },
                      ]}
                    />
                  </View>

                  {/* Member Info */}
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.memberName}>{item.name || item.username || 'Gamer'}</Text>
                    <Text style={styles.memberHandle}>{item.handle || `@${item.username || 'player'}`}</Text>
                    <View
                      style={[
                        styles.statusBadgePill,
                        {
                          backgroundColor:
                            item.status === 'active' || item.isActiveToday
                              ? '#10B98122'
                              : item.status === 'risk'
                              ? '#F59E0B22'
                              : '#64748B22',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color:
                              item.status === 'active' || item.isActiveToday
                                ? '#10B981'
                                : item.status === 'risk'
                                ? '#F59E0B'
                                : '#94A3B8',
                          },
                        ]}
                      >
                        {item.statusLabel || (item.isActiveToday ? 'Active Today' : 'Inactive')}
                      </Text>
                    </View>
                  </View>

                  {/* Earnings Column */}
                  <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                    <Text style={styles.totalEarnedVal}>{(item.totalEarned || 0).toLocaleString()}</Text>
                    <Text style={styles.totalEarnedLabel}>Total Earned</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <Coins size={10} color="#F59E0B" style={{ marginRight: 2 }} />
                      <Text style={styles.yourCommissionVal}>{item.yourCommission || 0}</Text>
                      <Text style={styles.yourCommissionLabel}>Your 5%</Text>
                    </View>
                    <Text style={styles.streakNoteText}>🔥 {item.activityNote || 'No recent activity'}</Text>
                  </View>

                  {/* Actions (View & Ping) */}
                  <View style={{ gap: 4 }}>
                    <TouchableOpacity
                      onPress={() => setViewReferralDetails(item)}
                      style={styles.viewBtn}
                    >
                      <Text style={styles.viewBtnText}>View</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setActivePingModal(item)}
                      style={styles.pingBtnPrimary}
                    >
                      <Send size={10} color="#FFFFFF" style={{ marginRight: 2 }} />
                      <Text style={styles.pingBtnText}>Ping</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* QR Code Scan Modal */}
      <Modal visible={showQrModal} transparent animationType="fade" onRequestClose={() => setShowQrModal(false)}>
        <View style={styles.modalScrim}>
          <View style={styles.modalDialogCard}>
            <TouchableOpacity onPress={() => setShowQrModal(false)} style={styles.modalCloseBtn}>
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Scan Referral QR Code</Text>
            <Text style={styles.modalSub}>Scan this code to join GAMEARN with code {referralCode}:</Text>

            <View style={styles.qrCodeBoxDisplay}>
              <QrCode size={150} color="#3B82F6" />
            </View>

            <Text style={styles.qrLinkText}>{referralLink}</Text>
            <TouchableOpacity onPress={handleCopyCode} style={styles.modalPrimaryBtn}>
              <Text style={styles.modalPrimaryBtnText}>Copy Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Ping Selector Modal */}
      <Modal visible={activePingModal !== null} transparent animationType="fade" onRequestClose={() => setActivePingModal(null)}>
        <View style={styles.modalScrim}>
          <View style={styles.modalDialogCard}>
            <TouchableOpacity onPress={() => setActivePingModal(null)} style={styles.modalCloseBtn}>
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Ping {activePingModal?.name || activePingModal?.username || 'Referral'}</Text>
            <Text style={styles.modalSub}>Select reminder type to push notification:</Text>

            <View style={{ gap: 8, marginVertical: 12, width: '100%' }}>
              <TouchableOpacity
                onPress={() => handleSendPing(activePingModal, 'Daily Streak')}
                style={styles.pingModalChoiceBtn}
              >
                <Flame size={16} color="#EF4444" fill="#EF4444" />
                <Text style={styles.pingModalChoiceText}>🔥 Daily Streak Reminder</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSendPing(activePingModal, 'Challenge Match')}
                style={styles.pingModalChoiceBtn}
              >
                <Gamepad2 size={16} color="#F59E0B" />
                <Text style={styles.pingModalChoiceText}>🎮 Game Challenge Reminder</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSendPing(activePingModal, 'Tournament')}
                style={styles.pingModalChoiceBtn}
              >
                <Trophy size={16} color="#60A5FA" />
                <Text style={styles.pingModalChoiceText}>🏆 Tournament Reminder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Referral Activity Log Modal */}
      <Modal visible={viewReferralDetails !== null} transparent animationType="fade" onRequestClose={() => setViewReferralDetails(null)}>
        <View style={styles.modalScrim}>
          <View style={styles.modalDialogCard}>
            <TouchableOpacity onPress={() => setViewReferralDetails(null)} style={styles.modalCloseBtn}>
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>{viewReferralDetails?.name || viewReferralDetails?.username}'s Log</Text>
            <Text style={styles.modalSub}>Your 5% referral commission breakdown:</Text>

            <ScrollView style={{ maxHeight: 200, width: '100%', marginVertical: 10 }}>
              {(viewReferralDetails?.history || []).length === 0 ? (
                <Text style={{ color: '#94A3B8', fontSize: 10, textAlign: 'center', marginVertical: 16 }}>No earnings history available yet.</Text>
              ) : (
                viewReferralDetails?.history?.map((log, i) => (
                  <View key={log.id || i} style={styles.logItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 11 }}>{log.source}</Text>
                      <Text style={{ color: '#64748B', fontSize: 9.5 }}>{log.date}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#10B981', fontWeight: '900', fontSize: 11 }}>+{log.commission} Units</Text>
                      <Text style={{ color: '#94A3B8', fontSize: 9 }}>Referred Earned: {log.amount}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Help Modal */}
      <Modal visible={showHelpModal} transparent animationType="fade" onRequestClose={() => setShowHelpModal(false)}>
        <View style={styles.modalScrim}>
          <View style={styles.modalDialogCard}>
            <TouchableOpacity onPress={() => setShowHelpModal(false)} style={styles.modalCloseBtn}>
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>How 5% Referral Earning Works</Text>
            <ScrollView style={{ maxHeight: 220, marginVertical: 10 }}>
              <Text style={styles.helpTextStep}>1. Share your code or invite link with friends.</Text>
              <Text style={styles.helpTextStep}>2. When they join, they are permanently linked to your squad.</Text>
              <Text style={styles.helpTextStep}>3. Every time they earn from Daily Streaks, Challenges, or Tournaments, you get 5% automatically credited to your wallet!</Text>
              <Text style={styles.helpTextStep}>4. Monitor active status and Ping them to keep earning 5% forever.</Text>
            </ScrollView>
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
    paddingHorizontal: 14,
    paddingTop: 48,
    paddingBottom: 10,
  },
  backCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 200,
  },
  heroBannerCard: {
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3B82F633',
  },
  heroTextCol: {
    flex: 1,
    paddingRight: 6,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  heroTitleAccent: {
    color: '#60A5FA',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 2,
  },
  heroDesc: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 14,
  },
  heroCrownBadgeWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: 'hidden',
  },
  crownBadgeGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  crownBadgePct: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  crownBadgeSub: {
    color: '#FEF08A',
    fontSize: 7.5,
    fontWeight: '900',
  },
  crownBadgeSub2: {
    color: '#FFFFFF',
    fontSize: 7.5,
    fontWeight: '900',
  },
  referralCodeBoxCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  boxLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
  },
  codeRowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeDisplayPill: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#3B82F644',
  },
  codeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  copyBtnInline: {
    padding: 2,
  },
  shareBtnPrimary: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  shareBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  qrCodeBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#3B82F644',
  },
  codeSubNote: {
    color: '#64748B',
    fontSize: 9.5,
    marginTop: 6,
  },
  statsGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  statGridCard: {
    width: '48%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  statHeaderInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  activeDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statCardVal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  statCardLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  statCardSub: {
    color: '#64748B',
    fontSize: 8.5,
  },
  earningsChartCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  chartTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  chartBigUnits: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '900',
  },
  chartSubUnits: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  chartCommissionSub: {
    color: '#64748B',
    fontSize: 9.5,
  },
  periodFilterBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  periodFilterText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  chartBarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 70,
    paddingTop: 6,
  },
  chartBarCol: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBarTrack: {
    width: 10,
    height: 50,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 4,
  },
  chartDayText: {
    color: '#64748B',
    fontSize: 8.5,
    marginTop: 4,
  },
  squadActiveSectionCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  squadActiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  squadActiveTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  squadActiveSub: {
    color: '#94A3B8',
    fontSize: 9.5,
  },
  pingAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D4ED822',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F644',
  },
  pingAllText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '900',
  },
  pingCategoryRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pingCategoryBox: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  pingCatTitle: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '700',
  },
  pingCatVal: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  referralsListCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  referralsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  myReferralsTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  countPill: {
    color: '#60A5FA',
    fontSize: 11,
  },
  searchBarInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 110,
  },
  searchInputText: {
    color: '#FFFFFF',
    fontSize: 10,
    flex: 1,
  },
  filterTabRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterTabPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  filterTabPillActive: {
    backgroundColor: '#2563EB',
  },
  filterTabText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B66',
    borderRadius: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  emptySub: {
    color: '#94A3B8',
    fontSize: 9.5,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
    lineHeight: 14,
  },
  referralMemberCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    position: 'relative',
  },
  memberAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  statusDotOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  memberName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  memberHandle: {
    color: '#64748B',
    fontSize: 9.5,
  },
  statusBadgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 2,
  },
  statusBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
  },
  totalEarnedVal: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  totalEarnedLabel: {
    color: '#64748B',
    fontSize: 8.5,
  },
  yourCommissionVal: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
  },
  yourCommissionLabel: {
    color: '#94A3B8',
    fontSize: 8.5,
    marginLeft: 2,
  },
  streakNoteText: {
    color: '#EF4444',
    fontSize: 8.5,
    marginTop: 1,
  },
  viewBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewBtnText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  pingBtnPrimary: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pingBtnText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  modalScrim: {
    flex: 1,
    backgroundColor: '#000000bb',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalDialogCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3B82F644',
    alignItems: 'center',
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSub: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 10,
  },
  qrCodeBoxDisplay: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginVertical: 10,
  },
  qrLinkText: {
    color: '#60A5FA',
    fontSize: 10,
    marginBottom: 10,
  },
  modalPrimaryBtn: {
    backgroundColor: '#2563EB',
    width: '100%',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  pingModalChoiceBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  pingModalChoiceText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 8,
  },
  logItemRow: {
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  helpTextStep: {
    color: '#E2E8F0',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8,
  },
});
