// Gamearn API Configuration
//
// Node API — Node.js/Socket.io on the DigitalOcean droplet (matchmaking,
// real-time, payments)
//
// Override at build time:
//   flutter run --dart-define=NODE_API_BASE=https://api.gamearn.app

class ApiConfig {
  /// Node.js backend — Socket.io + REST matchmaking + Paystack webhooks
  static const nodeBaseUrl = String.fromEnvironment(
    'NODE_API_BASE',
    defaultValue: 'https://api.gamearn.app',
  );
}
