/// Gamearn API Configuration
///
/// Bot API  — Python/FastAPI on Render (bot moves, game init)
/// Node API — Node.js/Socket.io on Render (matchmaking, real-time, payments)
///
/// Override at build time:
///   flutter run --dart-define=BOT_API_BASE=https://your-bot.onrender.com
///   flutter run --dart-define=NODE_API_BASE=https://your-node.onrender.com

class ApiConfig {
  /// Python bot microservice — /start_game  /get_move  /legal_actions
  static const botBaseUrl = String.fromEnvironment(
    'BOT_API_BASE',
    defaultValue: 'https://gamearn-bot.onrender.com',
  );

  /// Node.js backend — Socket.io + REST matchmaking + Paystack webhooks
  static const nodeBaseUrl = String.fromEnvironment(
    'NODE_API_BASE',
    defaultValue: 'https://backend-manager-vftt.onrender.com',
  );
}
