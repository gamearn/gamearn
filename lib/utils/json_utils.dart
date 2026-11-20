/// Converts JSON numeric values without assuming the decoder's concrete number
/// type. Returns `null` when the value cannot be represented as an integer.
int? jsonInt(Object? value) {
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value);
  return null;
}

/// Converts a JSON array to integers while discarding malformed entries.
List<int> jsonIntList(Object? value) => value is List
    ? value.map(jsonInt).whereType<int>().toList(growable: false)
    : const <int>[];

/// Normalizes decoded JSON objects to `Map<String, dynamic>`.
List<Map<String, dynamic>> jsonMapList(Object? value) => value is List
    ? value
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList(growable: false)
    : const <Map<String, dynamic>>[];
