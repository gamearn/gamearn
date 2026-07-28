import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user_model.dart';
import '../models/wallet_model.dart';
import '../models/tournament_model.dart';
import '../models/leaderboard_model.dart';
import '../models/notification_model.dart';
import '../models/transaction_model.dart';
import '../models/daily_streak_model.dart';
import '../models/challenge_model.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // ── Singleton ─────────────────────────────────────────────────────────────
  static final FirestoreService _instance = FirestoreService._();
  factory FirestoreService() => _instance;
  FirestoreService._();

  // ── Users ─────────────────────────────────────────────────────────────────

  Stream<UserModel> userStream(String uid) {
    return _db.collection('users').doc(uid).snapshots().map(UserModel.fromDoc);
  }

  Future<UserModel?> getUser(String uid) async {
    final doc = await _db.collection('users').doc(uid).get();
    return doc.exists ? UserModel.fromDoc(doc) : null;
  }

  Future<void> updateUser(String uid, Map<String, dynamic> data) {
    data['updatedAt'] = FieldValue.serverTimestamp();
    return _db.collection('users').doc(uid).update(data);
  }

  Future<bool> usernameAvailable(String username) async {
    final q = await _db
        .collection('users')
        .where('username', isEqualTo: username)
        .limit(1)
        .get();
    return q.docs.isEmpty;
  }

  // ── Wallets ───────────────────────────────────────────────────────────────

  Stream<WalletModel> walletStream(String uid) {
    return _db.collection('wallets').doc(uid).snapshots().map(WalletModel.fromDoc);
  }

  Future<WalletModel?> getWallet(String uid) async {
    final doc = await _db.collection('wallets').doc(uid).get();
    return doc.exists ? WalletModel.fromDoc(doc) : null;
  }

  // ── Transactions ──────────────────────────────────────────────────────────

  Stream<List<TransactionModel>> transactions(String uid, {int limit = 20}) {
    return _db
        .collection('wallets')
        .doc(uid)
        .collection('transactions')
        .orderBy('createdAt', descending: true)
        .limit(limit)
        .snapshots()
        .map((q) => q.docs.map(TransactionModel.fromDoc).toList());
  }

  // ── Tournaments ───────────────────────────────────────────────────────────

  Stream<List<Tournament>> upcomingTournaments({String? gameType, int limit = 20}) {
    Query q = _db
        .collection('tournaments')
        .where('status', whereIn: ['pending', 'registration_open'])
        .orderBy('createdAt', descending: true)
        .limit(limit);

    if (gameType != null) {
      q = q.where('gameType', isEqualTo: gameType);
    }

    return q.snapshots().map((snap) => snap.docs.map(Tournament.fromDoc).toList());
  }

  Stream<List<Tournament>> myTournaments(String uid) {
    return _db
        .collection('tournaments')
        .where('players', arrayContains: uid)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snap) => snap.docs.map(Tournament.fromDoc).toList());
  }

  Stream<Tournament> tournamentStream(String id) {
    return _db.collection('tournaments').doc(id).snapshots().map(Tournament.fromDoc);
  }

  // ── Leaderboard ───────────────────────────────────────────────────────────

  Stream<List<LeaderboardEntry>> leaderboard(String field, {int limit = 10}) {
    return _db
        .collection('leaderboard')
        .orderBy(field, descending: true)
        .limit(limit)
        .snapshots()
        .map((q) => q.docs.map(LeaderboardEntry.fromDoc).toList());
  }

  Future<LeaderboardEntry?> getLeaderboardEntry(String uid) async {
    final doc = await _db.collection('leaderboard').doc(uid).get();
    return doc.exists ? LeaderboardEntry.fromDoc(doc) : null;
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  Stream<List<AppNotification>> notifications(String uid, {int limit = 30}) {
    return _db
        .collection('notifications')
        .where('userId', isEqualTo: uid)
        .orderBy('createdAt', descending: true)
        .limit(limit)
        .snapshots()
        .map((q) => q.docs.map(AppNotification.fromDoc).toList());
  }

  Future<void> markNotificationRead(String notifId) {
    return _db.collection('notifications').doc(notifId).update({'read': true});
  }

  Future<void> markAllNotificationsRead(String uid) async {
    final q = await _db
        .collection('notifications')
        .where('userId', isEqualTo: uid)
        .where('read', isEqualTo: false)
        .get();

    final batch = _db.batch();
    for (final doc in q.docs) {
      batch.update(doc.reference, {'read': true});
    }
    await batch.commit();
  }

  // ── Daily Streaks ─────────────────────────────────────────────────────────

  Stream<DailyStreak> streakStream(String uid) {
    return _db
        .collection('daily_streaks')
        .doc(uid)
        .snapshots()
        .map(DailyStreak.fromDoc);
  }

  // ── Challenges ────────────────────────────────────────────────────────────

  Stream<List<Challenge>> myChallenges(String uid) {
    return _db
        .collection('challenges')
        .where('opponentUid', isEqualTo: uid)
        .where('status', isEqualTo: 'pending')
        .snapshots()
        .map((q) => q.docs.map(Challenge.fromDoc).toList());
  }

  Future<String> createChallenge(Challenge challenge) async {
    final ref = await _db.collection('challenges').add(challenge.toMap());
    return ref.id;
  }

  // ── Friends / Followers ───────────────────────────────────────────────────

  Stream<List<UserModel>> following(String uid) {
    return _db
        .collection('users')
        .doc(uid)
        .collection('following')
        .snapshots()
        .asyncMap((q) async {
      final users = <UserModel>[];
      for (final doc in q.docs) {
        final user = await getUser(doc.id);
        if (user != null) users.add(user);
      }
      return users;
    });
  }

  Future<void> toggleFollow(String myUid, String targetUid, String targetUsername, String targetAvatar) async {
    final myFollowing = _db.collection('users').doc(myUid).collection('following').doc(targetUid);
    final targetFollowers = _db.collection('users').doc(targetUid).collection('followers').doc(myUid);

    final exists = (await myFollowing.get()).exists;

    final batch = _db.batch();
    if (exists) {
      batch.delete(myFollowing);
      batch.delete(targetFollowers);
    } else {
      batch.set(myFollowing, {'uid': targetUid, 'username': targetUsername, 'avatar': targetAvatar, 'followedAt': FieldValue.serverTimestamp()});
      batch.set(targetFollowers, {'uid': myUid, 'followedAt': FieldValue.serverTimestamp()});
    }
    await batch.commit();
  }

  // ── Search ────────────────────────────────────────────────────────────────

  Future<List<UserModel>> searchUsers(String query, {int limit = 20}) async {
    if (query.isEmpty) return [];
    final q = await _db
        .collection('users')
        .where('username', isGreaterThanOrEqualTo: query.toLowerCase())
        .where('username', isLessThanOrEqualTo: '${query.toLowerCase()}\uf8ff')
        .limit(limit)
        .get();
    return q.docs.map(UserModel.fromDoc).toList();
  }
}
