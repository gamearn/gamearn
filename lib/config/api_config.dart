// Gamearn API Configuration
//
// Node API — Node.js/Socket.io on Render (matchmaking, real-time, payments)
//
// Override at build time:
//   flutter run --dart-define=NODE_API_BASE=https://your-node.onrender.com

class ApiConfig {
  /// Node.js backend — Socket.io + REST matchmaking + Flutterwave webhooks
  static const nodeBaseUrl = String.fromEnvironment(
    'NODE_API_BASE',
    defaultValue: 'https://gamearn-backend.onrender.com',
  );
}
