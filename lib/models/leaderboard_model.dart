import 'package:cloud_firestore/cloud_firestore.dart';

class LeaderboardEntry {
  final String uid;
  final String username;
  final String avatar;
  final int dailyScore;
  final int weeklyScore;
  final int monthlyScore;
  final int yearlyScore;
  final int allTimeScore;
  final Map<String, int> gamesPlayed;
  final Map<String, int> wins;

  const LeaderboardEntry({
    required this.uid,
    required this.username,
    this.avatar = '😀',
    this.dailyScore = 0,
    this.weeklyScore = 0,
    this.monthlyScore = 0,
    this.yearlyScore = 0,
    this.allTimeScore = 0,
    this.gamesPlayed = const {},
    this.wins = const {},
  });

  factory LeaderboardEntry.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>? ?? {};
    return LeaderboardEntry(
      uid: doc.id,
      username: d['username'] ?? '',
      avatar: d['avatar'] ?? '😀',
      dailyScore: d['dailyScore'] ?? 0,
      weeklyScore: d['weeklyScore'] ?? 0,
      monthlyScore: d['monthlyScore'] ?? 0,
      yearlyScore: d['yearlyScore'] ?? 0,
      allTimeScore: d['allTimeScore'] ?? 0,
      gamesPlayed: Map<String, int>.from(d['gamesPlayed'] ?? {}),
      wins: Map<String, int>.from(d['wins'] ?? {}),
    );
  }

  int scoreFor(String field) {
    switch (field) {
      case 'dailyScore':
        return dailyScore;
      case 'weeklyScore':
        return weeklyScore;
      case 'monthlyScore':
        return monthlyScore;
      case 'yearlyScore':
        return yearlyScore;
      case 'allTimeScore':
        return allTimeScore;
      default:
        return allTimeScore;
    }
  }
}
