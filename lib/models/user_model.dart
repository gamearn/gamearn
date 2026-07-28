import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  final String uid;
  final String username;
  final String displayName;
  final String avatar;
  final String memberStatus;
  final int dayStreak;
  final DateTime? lastClaimAt;
  final int level;
  final int xp;
  final int xpNext;
  final int wins;
  final int gamesPlayed;
  final String rank;
  final String bio;
  final String role;
  final bool isAdmin;
  final bool online;
  final List<String> friends;
  final DateTime createdAt;
  final DateTime updatedAt;

  const UserModel({
    required this.uid,
    required this.username,
    this.displayName = '',
    this.avatar = '😀',
    this.memberStatus = 'free',
    this.dayStreak = 0,
    this.lastClaimAt,
    this.level = 1,
    this.xp = 0,
    this.xpNext = 100,
    this.wins = 0,
    this.gamesPlayed = 0,
    this.rank = 'Bronze',
    this.bio = '',
    this.role = 'user',
    this.isAdmin = false,
    this.online = false,
    this.friends = const [],
    required this.createdAt,
    required this.updatedAt,
  });

  factory UserModel.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>? ?? {};
    return UserModel(
      uid: doc.id,
      username: d['username'] ?? '',
      displayName: d['displayName'] ?? d['username'] ?? '',
      avatar: d['avatar'] ?? '😀',
      memberStatus: d['memberStatus'] ?? 'free',
      dayStreak: d['dayStreak'] ?? 0,
      lastClaimAt: d['lastClaimAt'] != null
          ? (d['lastClaimAt'] as Timestamp).toDate()
          : null,
      level: d['level'] ?? 1,
      xp: d['xp'] ?? 0,
      xpNext: d['xpNext'] ?? 100,
      wins: d['wins'] ?? 0,
      gamesPlayed: d['gamesPlayed'] ?? 0,
      rank: d['rank'] ?? 'Bronze',
      bio: d['bio'] ?? '',
      role: d['role'] ?? 'user',
      isAdmin: d['isAdmin'] ?? false,
      online: d['online'] ?? false,
      friends: List<String>.from(d['friends'] ?? []),
      createdAt: d['createdAt'] != null
          ? (d['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
      updatedAt: d['updatedAt'] != null
          ? (d['updatedAt'] as Timestamp).toDate()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() => {
        'username': username,
        'displayName': displayName,
        'avatar': avatar,
        'memberStatus': memberStatus,
        'dayStreak': dayStreak,
        'lastClaimAt': lastClaimAt != null ? Timestamp.fromDate(lastClaimAt!) : null,
        'level': level,
        'xp': xp,
        'xpNext': xpNext,
        'wins': wins,
        'gamesPlayed': gamesPlayed,
        'rank': rank,
        'bio': bio,
        'role': role,
        'isAdmin': isAdmin,
        'online': online,
        'friends': friends,
        'createdAt': Timestamp.fromDate(createdAt),
        'updatedAt': FieldValue.serverTimestamp(),
      };

  UserModel copyWith({
    String? username,
    String? displayName,
    String? avatar,
    String? memberStatus,
    int? dayStreak,
    DateTime? lastClaimAt,
    int? level,
    int? xp,
    int? xpNext,
    int? wins,
    int? gamesPlayed,
    String? rank,
    String? bio,
    String? role,
    bool? isAdmin,
    bool? online,
    List<String>? friends,
  }) =>
      UserModel(
        uid: uid,
        username: username ?? this.username,
        displayName: displayName ?? this.displayName,
        avatar: avatar ?? this.avatar,
        memberStatus: memberStatus ?? this.memberStatus,
        dayStreak: dayStreak ?? this.dayStreak,
        lastClaimAt: lastClaimAt ?? this.lastClaimAt,
        level: level ?? this.level,
        xp: xp ?? this.xp,
        xpNext: xpNext ?? this.xpNext,
        wins: wins ?? this.wins,
        gamesPlayed: gamesPlayed ?? this.gamesPlayed,
        rank: rank ?? this.rank,
        bio: bio ?? this.bio,
        role: role ?? this.role,
        isAdmin: isAdmin ?? this.isAdmin,
        online: online ?? this.online,
        friends: friends ?? this.friends,
        createdAt: createdAt,
        updatedAt: updatedAt,
      );
}
