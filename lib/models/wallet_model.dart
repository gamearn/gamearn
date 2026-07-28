import 'package:cloud_firestore/cloud_firestore.dart';

class WalletModel {
  final String uid;
  final int balance;
  final int units;
  final int usdEquiv;
  final int streakDays;
  final int level;
  final int coins;
  final DateTime updatedAt;

  const WalletModel({
    required this.uid,
    this.balance = 0,
    this.units = 0,
    this.usdEquiv = 0,
    this.streakDays = 0,
    this.level = 1,
    this.coins = 0,
    required this.updatedAt,
  });

  factory WalletModel.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>? ?? {};
    return WalletModel(
      uid: doc.id,
      balance: d['balance'] ?? 0,
      units: d['units'] ?? 0,
      usdEquiv: d['usdEquiv'] ?? 0,
      streakDays: d['streakDays'] ?? 0,
      level: d['level'] ?? 1,
      coins: d['coins'] ?? 0,
      updatedAt: d['updatedAt'] != null
          ? (d['updatedAt'] as Timestamp).toDate()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() => {
        'balance': balance,
        'units': units,
        'usdEquiv': usdEquiv,
        'streakDays': streakDays,
        'level': level,
        'coins': coins,
        'updatedAt': FieldValue.serverTimestamp(),
      };
}
