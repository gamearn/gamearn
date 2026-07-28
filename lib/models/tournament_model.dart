import 'package:cloud_firestore/cloud_firestore.dart';

class Tournament {
  final String id;
  final String title;
  final String description;
  final String gameType;
  final int prizePool;
  final int entryCost;
  final int maxPlayers;
  final int currentPlayers;
  final List<String> players;
  final String status;
  final String createdBy;
  final DateTime createdAt;
  final DateTime? startTime;
  final Map<String, dynamic>? rules;
  final List<Map<String, dynamic>>? results;

  const Tournament({
    required this.id,
    required this.title,
    this.description = '',
    required this.gameType,
    this.prizePool = 0,
    this.entryCost = 0,
    this.maxPlayers = 100,
    this.currentPlayers = 0,
    this.players = const [],
    this.status = 'pending',
    required this.createdBy,
    required this.createdAt,
    this.startTime,
    this.rules,
    this.results,
  });

  factory Tournament.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>? ?? {};
    return Tournament(
      id: doc.id,
      title: d['title'] ?? '',
      description: d['description'] ?? '',
      gameType: d['gameType'] ?? '',
      prizePool: d['prizePool'] ?? 0,
      entryCost: d['entryCost'] ?? 0,
      maxPlayers: d['maxPlayers'] ?? 100,
      currentPlayers: d['currentPlayers'] ?? d['playerCount'] ?? 0,
      players: List<String>.from(d['players'] ?? []),
      status: d['status'] ?? 'pending',
      createdBy: d['createdBy'] ?? '',
      createdAt: d['createdAt'] != null
          ? (d['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
      startTime: d['startTime'] != null
          ? (d['startTime'] as Timestamp).toDate()
          : null,
      rules: d['rules'] as Map<String, dynamic>?,
      results: d['results'] != null
          ? List<Map<String, dynamic>>.from(d['results'])
          : null,
    );
  }

  Map<String, dynamic> toMap() => {
        'title': title,
        'description': description,
        'gameType': gameType,
        'prizePool': prizePool,
        'entryCost': entryCost,
        'maxPlayers': maxPlayers,
        'currentPlayers': currentPlayers,
        'playerCount': currentPlayers,
        'players': players,
        'status': status,
        'createdBy': createdBy,
        'createdAt': Timestamp.fromDate(createdAt),
        'startTime': startTime != null ? Timestamp.fromDate(startTime!) : null,
        if (rules != null) 'rules': rules,
        if (results != null) 'results': results,
      };

  bool get isFull => currentPlayers >= maxPlayers;
  bool get canJoin => !isFull && status == 'pending';
}
