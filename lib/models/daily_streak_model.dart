import 'package:cloud_firestore/cloud_firestore.dart';

class DailyStreak {
  final String uid;
  final int currentStreak;
  final int longestStreak;
  final DateTime? lastClaimDate;
  final DateTime? lastPlayedDate;
  final bool frozen;
  final int freezeCount;
  final DateTime? unlockedAt;
  final int totalCoinsEarned;
  final int milestoneReached;

  const DailyStreak({
    required this.uid,
    this.currentStreak = 0,
    this.longestStreak = 0,
    this.lastClaimDate,
    this.lastPlayedDate,
    this.frozen = false,
    this.freezeCount = 0,
    this.unlockedAt,
    this.totalCoinsEarned = 0,
    this.milestoneReached = 0,
  });

  factory DailyStreak.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>? ?? {};
    return DailyStreak(
      uid: doc.id,
      currentStreak: d['currentStreak'] ?? 0,
      longestStreak: d['longestStreak'] ?? 0,
      lastClaimDate: d['lastClaimDate'] != null
          ? (d['lastClaimDate'] as Timestamp).toDate()
          : null,
      lastPlayedDate: d['lastPlayedDate'] != null
          ? (d['lastPlayedDate'] as Timestamp).toDate()
          : null,
      frozen: d['frozen'] ?? false,
      freezeCount: d['freezeCount'] ?? 0,
      unlockedAt: d['unlockedAt'] != null
          ? (d['unlockedAt'] as Timestamp).toDate()
          : null,
      totalCoinsEarned: d['totalCoinsEarned'] ?? 0,
      milestoneReached: d['milestoneReached'] ?? 0,
    );
  }

  bool get claimedToday {
    if (lastClaimDate == null) return false;
    final now = DateTime.now();
    return lastClaimDate!.year == now.year &&
        lastClaimDate!.month == now.month &&
        lastClaimDate!.day == now.day;
  }
}
