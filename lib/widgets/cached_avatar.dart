import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

/// High-efficiency UI widget for avatar image retrieval.
/// Caches via cached_network_image (SQLite-backed local storage) to bypass
/// repetitive Firebase Storage download calls and protect egress thresholds.
class ProductionCachedAvatarWidget extends StatelessWidget {
  final String targetProfileUrl;
  final double displayDiameter;

  const ProductionCachedAvatarWidget({
    super.key,
    required this.targetProfileUrl,
    this.displayDiameter = 90.0,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(displayDiameter / 2),
      child: targetProfileUrl.isEmpty
          ? Icon(Icons.account_circle,
              size: displayDiameter, color: Colors.grey)
          : CachedNetworkImage(
              imageUrl: targetProfileUrl,
              width: displayDiameter,
              height: displayDiameter,
              fit: BoxFit.cover,
              placeholder: (BuildContext context, String url) => SizedBox(
                width: displayDiameter,
                height: displayDiameter,
                child: const CircularProgressIndicator(strokeWidth: 2.0),
              ),
              errorWidget: (BuildContext context, String url, Object error) =>
                  Icon(Icons.error_outline,
                      size: displayDiameter, color: Colors.red),
            ),
    );
  }
}
