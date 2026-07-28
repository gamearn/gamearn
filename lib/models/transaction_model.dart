import 'package:cloud_firestore/cloud_firestore.dart';

class TransactionModel {
  final String id;
  final String type;
  final String description;
  final int units;
  final int usdAmount;
  final String status;
  final DateTime createdAt;

  const TransactionModel({
    required this.id,
    required this.type,
    this.description = '',
    this.units = 0,
    this.usdAmount = 0,
    this.status = 'completed',
    required this.createdAt,
  });

  factory TransactionModel.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>? ?? {};
    return TransactionModel(
      id: doc.id,
      type: d['type'] ?? '',
      description: d['description'] ?? '',
      units: d['units'] ?? 0,
      usdAmount: d['usdAmount'] ?? 0,
      status: d['status'] ?? 'completed',
      createdAt: d['createdAt'] != null
          ? (d['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
    );
  }

  bool get isCredit => type == 'credit' || type == 'deposit' || type == 'prize';
}
