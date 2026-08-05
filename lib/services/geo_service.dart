import 'dart:convert';
import 'package:http/http.dart' as http;

/// Best-effort country detection from the client's IP address.
///
/// Uses ipwho.is (free tier, HTTPS, no API key). Always resolves gracefully:
/// returns null on any failure so callers can fall back to a default.
class GeoCountryService {
  static const String _endpoint = 'https://ipwho.is/';

  /// Returns the user's country ISO-3166 alpha-2 code (e.g. `NG`) or null if
  /// unknown.
  static Future<String?> getCountryIso() async {
    try {
      final res = await http
          .get(Uri.parse(_endpoint))
          .timeout(const Duration(seconds: 4));
      if (res.statusCode != 200) return null;
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] != true) return null;
      final iso = body['country_code'] as String?;
      if (iso == null || iso.isEmpty) return null;
      return iso;
    } catch (_) {
      return null;
    }
  }
}
