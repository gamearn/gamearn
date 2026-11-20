import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Gift, Sparkles } from 'lucide-react-native';

export default function StreakRewardModal({
  visible,
  onClose,
  onClaim,
  claiming = false,
  title = 'Streak Milestone Completed!',
  subtitle = 'Congratulations on completing your streak milestone!',
  badgeLabel = 'STREAK REWARD',
  rewardVp = 1,
}) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <LinearGradient
            colors={['#131C38', '#0B1024', '#070A18']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Top-right X button to remove/close modal */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityLabel="Close reward modal"
            style={styles.closeBtn}
          >
            <X size={20} color="#E2E8F0" />
          </TouchableOpacity>

          {/* Header Pill */}
          <View style={styles.badgePill}>
            <Sparkles size={14} color="#FDE047" />
            <Text style={styles.badgePillText}>{badgeLabel}</Text>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Gift Box Container with VP Inside */}
          <View style={styles.giftBoxWrapper}>
            <View style={styles.giftGlow} />
            <LinearGradient
              colors={['rgba(245, 158, 11, 0.25)', 'rgba(120, 53, 15, 0.35)']}
              style={styles.giftBoxContainer}
            >
              <View style={styles.giftIconCircle}>
                <Text style={styles.giftEmoji}>🎁</Text>
                <Gift size={28} color="#FDE047" style={{ marginTop: -6 }} />
              </View>
              <View style={styles.vpRewardPill}>
                <Text style={styles.vpRewardText}>+{rewardVp} VP</Text>
              </View>
              <Text style={styles.giftCaption}>Value Points Reward</Text>
            </LinearGradient>
          </View>

          {/* Golden Claim Button Underneath Gift Box */}
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={claiming}
            onPress={onClaim}
            style={styles.claimBtnWrap}
          >
            <LinearGradient
              colors={['#FDE047', '#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.claimBtnGrad}
            >
              {claiming ? (
                <ActivityIndicator size="small" color="#1E1B4B" />
              ) : (
                <Text style={styles.claimBtnText}>Claim</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 7, 18, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 370,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#F59E0B',
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 22,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 71, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgePillText: {
    color: '#FDE047',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  giftBoxWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    position: 'relative',
  },
  giftGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
  },
  giftBoxContainer: {
    width: '88%',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(253, 224, 71, 0.6)',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(253, 224, 71, 0.15)',
    borderWidth: 2,
    borderColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  giftEmoji: {
    fontSize: 44,
  },
  vpRewardPill: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    marginBottom: 6,
  },
  vpRewardText: {
    color: '#070C1B',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  giftCaption: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '700',
  },
  claimBtnWrap: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  claimBtnGrad: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  claimBtnText: {
    color: '#1C1917',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

