import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path_provider/path_provider.dart';
import 'package:firebase_storage/firebase_storage.dart';

/// Business logic manager responsible for processing media operations before
/// they contact the server infrastructure.
///
/// Per the production spec, the upload path is **direct-to-Firebase**: the
/// Node.js server never touches the image bytes. The 24h / one-per-day limit
/// is enforced server-side by the Firebase Storage security rules
/// (storage.rules), which cross-reference the server-stamped cooldown record
/// at upload_cooldowns/{uid}.lastProfileUpload in Cloud Firestore.
///
/// The client does NOT write the timestamp: the Cloud Function
/// `enforceAvatarCooldown` stamps it on every Storage finalize, so a
/// malicious/broken client that skips the write or drops the connection
/// cannot bypass the limit. This client only (1) compresses the image to stay
/// under the 150 KB rules cap and (2) uploads it to the fixed overwrite path
/// the rules gate on.
class AvatarExecutionPipeline {
  /// Compresses the picked image on native hardware threads.
  /// Downscales to 400x400 and caps quality to keep the file < 150 KB.
  static Future<File?> pickAndProcessImage() async {
    try {
      final ImagePicker picker = ImagePicker();

      // Source image selection from the system gallery.
      final XFile? rawImage = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 400,
        maxHeight: 400,
      );

      if (rawImage == null) return null; // Cancelled by the user.

      // Isolated scratchpad partition for temporary compilation.
      final Directory systemTempDir = await getTemporaryDirectory();
      final String compilationPath =
          '${systemTempDir.absolute.path}/compressed_avatar_'
          '${DateTime.now().millisecondsSinceEpoch}.jpg';

      // Native hardware-accelerated transcoding block.
      final XFile? compressedResult = await FlutterImageCompress
          .compressAndGetFile(
        rawImage.path,
        compilationPath,
        quality: 70, // Balanced lossy quantization.
        format: CompressFormat.jpeg,
      );

      if (compressedResult == null) return null;
      return File(compressedResult.path);
    } catch (e) {
      debugPrint('Pre-processing execution pipeline failure: $e');
      return null;
    }
  }

  /// Sends the processed payload directly to Firebase Storage at the fixed
  /// overwrite path (users/{targetUserId}/profile.jpg) — the exact structure
  /// storage.rules gates on.
  ///
  /// Returns `false` when the Storage rules reject the write with 403
  /// (24h cooldown active, not the owner, or over the 150 KB cap).
  static Future<bool> commitAvatarMutation({
    required File imageFile,
    required String targetUserId,
  }) async {
    try {
      final Reference bucketFileRef = FirebaseStorage.instance
          .ref()
          .child('users/$targetUserId/profile.jpg');

      await bucketFileRef.putFile(imageFile);
      return true;
    } catch (storageOrDatabaseException) {
      // Intercepts status 403/429 thrown by rules violations.
      debugPrint('Firebase Storage mutation rejected by security policies: '
          '$storageOrDatabaseException');
      return false;
    }
  }
}
