/// Bot API base URL — staging on Render; override for DigitalOcean production.
///
/// Production build example:
///   flutter run --dart-define=BOT_API_BASE=https://api.yourdomain.com
class ApiConfig {
  static const botBaseUrl = String.fromEnvironment(
    'BOT_API_BASE',
    defaultValue: 'https://gamearn-bot.onrender.com',
  );
}
