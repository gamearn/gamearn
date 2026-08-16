import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Aggressive local cache on top of Firestore to cut billed reads.
///
/// How it works:
///  * Firestore's own offline persistence is enabled (see main.dart), so the
///    client keeps a local copy of every doc/query it has seen.
///  * Each read records a "last fetched" timestamp in SharedPreferences.
///  * While the entry is fresh (within [ttl]), reads are served straight from
///    Firestore's LOCAL cache via `Source.cache` — these cost ZERO network
///    reads and therefore nothing on the bill.
///  * When the TTL expires the next read hits the server (1 billed read) and
///    refreshes the local copy + timestamp.
///  * Call [invalidate] after any local write so the very next read fetches
///    the fresh server value instead of serving stale cache.
///
/// Values are never re-serialized (unlike a JSON blob cache) so Timestamps and
/// other Firestore-native types survive the round-trip untouched.
class FirestoreCache {
  FirestoreCache._();
  static final FirestoreCache instance = FirestoreCache._();

  static const _kPrefix = 'fscache_ts:';

  SharedPreferences? _prefs;

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  bool _fresh(String key, Duration ttl) {
    final p = _prefs;
    if (p == null) return false;
    final ts = p.getInt(_kPrefix + key);
    if (ts == null) return false;
    return DateTime.fromMillisecondsSinceEpoch(ts)
        .add(ttl)
        .isAfter(DateTime.now());
  }

  void _markFetched(String key) {
    _prefs?.setInt(_kPrefix + key, DateTime.now().millisecondsSinceEpoch);
  }

  /// Drop the freshness marker so the next read for [key] hits the server.
  /// Call this right after writing to the matching Firestore path.
  void invalidate(String key) {
    _prefs?.remove(_kPrefix + key);
  }

  /// Cache-first read of a single document.
  Future<Map<String, dynamic>> doc(
    String collection,
    String id, {
    Duration ttl = const Duration(minutes: 5),
  }) async {
    final key = '$collection/$id';
    final ref = FirebaseFirestore.instance.collection(collection).doc(id);

    if (_fresh(key, ttl)) {
      try {
        final cached = await ref.get(const GetOptions(source: Source.cache));
        if (cached.exists) return cached.data()!;
      } catch (_) {
        // Local copy missing or unreadable → fall through to the server.
      }
    }

    final snap = await ref.get();
    _markFetched(key);
    return snap.data() ?? <String, dynamic>{};
  }

  /// Cache-first read of a query result.
  ///
  /// [key] must uniquely identify this exact query (collection + filters +
  /// ordering) so different queries don't share freshness markers. [build]
  /// returns the Query; results are read from the local cache when fresh.
  Future<List<Map<String, dynamic>>> query(
    String key, {
    required Duration ttl,
    required Query Function() build,
  }) async {
    final q = build();

    if (_fresh(key, ttl)) {
      try {
        final snap = await q.get(const GetOptions(source: Source.cache));
        if (snap.docs.isNotEmpty) {
          return snap.docs.map((d) => d.data() as Map<String, dynamic>).toList();
        }
      } catch (_) {
        // Cache miss → fall through to the server.
      }
    }

    final snap = await q.get();
    _markFetched(key);
    return snap.docs.map((d) => d.data() as Map<String, dynamic>).toList();
  }
}
