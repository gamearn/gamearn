/// Cooldown calculator responsible for frontend state resolution.
///
/// Reads the users/{userId}.lastProfileUpload timestamp that the
/// AvatarExecutionPipeline commits to Firestore and converts it into a
/// remaining-hours value the UI uses to gate the "change avatar" button.
class ProfileCooldownManager {
  /// Evaluates the Firestore timestamp against the local clock.
  /// Returns 0 if the 24h constraint has passed (or no upload yet).
  static int evaluateRemainingHours(DateTime? lastUploadTimestamp) {
    if (lastUploadTimestamp == null) return 0;

    final DateTime chronologicalNow = DateTime.now();
    final DateTime unlockThresholdTime =
        lastUploadTimestamp.add(const Duration(hours: 24));

    if (chronologicalNow.isAfter(unlockThresholdTime)) {
      return 0; // Cooldown constraint cleared.
    }

    return unlockThresholdTime.difference(chronologicalNow).inHours;
  }

  /// Ceil-based hours (so "23h 10m" reports 24 remaining instead of 23),
  /// matching how the server rules compute the +24h window.
  static int evaluateRemainingHoursCeil(DateTime? lastUploadTimestamp) {
    if (lastUploadTimestamp == null) return 0;

    final DateTime chronologicalNow = DateTime.now();
    final DateTime unlockThresholdTime =
        lastUploadTimestamp.add(const Duration(hours: 24));

    if (!chronologicalNow.isBefore(unlockThresholdTime)) {
      return 0;
    }

    final diff = unlockThresholdTime.difference(chronologicalNow);
    return (diff.inSeconds / 3600).ceil();
  }

  /// Human-readable countdown, e.g. "23 h 10 m".
  static String formatRemaining(DateTime? lastUploadTimestamp) {
    if (lastUploadTimestamp == null) return '';

    final DateTime unlockThresholdTime =
        lastUploadTimestamp.add(const Duration(hours: 24));
    final diff = unlockThresholdTime.difference(DateTime.now());
    if (diff <= Duration.zero) return '';

    final hours = diff.inHours;
    final minutes = (diff.inMinutes % 60);
    if (hours > 0) return '$hours h $minutes m';
    return '${minutes} m';
  }
}
