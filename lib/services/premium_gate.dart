import 'api_service.dart';

class AdsGate {
  static Future<bool> isPremium() async {
    try {
      final data = await ApiService.getPremiumStatus();
      return data['isPremium'] == true;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> canShowAds() async => !await isPremium();
}
