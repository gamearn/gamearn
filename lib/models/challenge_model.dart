import 'package:cloud_firestore/cloud_firestore.dart';

class Challenge {
  final String id;
  final String challengerUid;
  final String challengerName;
  final String opponentUid;
  final String opponentName;
  final String gameType;
  final int entryFee;
  final String status;
  final DateTime createdAt;
  final DateTime? expiresAt;

  const Challenge({
    required this.id,
    required this.challengerUid,
    this.challengerName = '',
    required this.opponentUid,
    this.opponentName = '',
    required this.gameType,
    this.entryFee = 0,
    this.status = 'pending',
    required this.createdAt,
    this.expiresAt,
  });

  factory Challenge.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>? ?? {};
    return Challenge(
      id: doc.id,
      challengerUid: d['challengerUid'] ?? '',
      challengerName: d['challengerName'] ?? '',
      opponentUid: d['opponentUid'] ?? '',
      opponentName: d['opponentName'] ?? '',
      gameType: d['gameType'] ?? '',
      entryFee: d['entryFee'] ?? 0,
      status: d['status'] ?? 'pending',
      createdAt: d['createdAt'] != null
          ? (d['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
      expiresAt: d['expiresAt'] != null
          ? (d['expiresAt'] as Timestamp).toDate()
          : null,
    );
  }

  Map<String, dynamic> toMap() => {
        'challengerUid': challengerUid,
        'challengerName': challengerName,
        'opponentUid': opponentUid,
        'opponentName': opponentName,
        'gameType': gameType,
        'entryFee': entryFee,
        'status': status,
        'createdAt': Timestamp.fromDate(createdAt),
        if (expiresAt != null) 'expiresAt': Timestamp.fromDate(expiresAt!),
      };
}
