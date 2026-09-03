import 'api_service.dart';

/// Thin wrapper around ApiService premium endpoints.
class PremiumService {
  Future<List<Map<String, dynamic>>> fetchPlans() =>
      ApiService.getPremiumPlans();

  Future<Map<String, dynamic>> status() => ApiService.getPremiumStatus();

  Future<Map<String, dynamic>> purchase({
    required String plan,
    String paymentMethod = 'card',
  }) =>
      ApiService.initiatePremium(plan: plan, paymentMethod: paymentMethod);

  /// Polls verifyPremium every 3 s (up to 30 attempts).
  /// Returns `true` once the user is premium.
  Future<bool> verifyPoll(String txRef) async {
    const maxAttempts = 30;
    for (var i = 0; i < maxAttempts; i++) {
      await Future.delayed(const Duration(seconds: 3));
      final result = await ApiService.verifyPremium(txRef);
      if (result['isPremium'] == true) return true;
    }
    return false;
  }
}
