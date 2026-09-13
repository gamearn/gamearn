import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../theme.dart';

/// Honest placeholder for admin features that do not yet have an authenticated
/// server data source. It deliberately renders no sample operational data.
class AdminUnavailableScreen extends StatelessWidget {
  final String title;
  final String message;
  final IconData icon;

  const AdminUnavailableScreen({
    super.key,
    required this.title,
    required this.message,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(title: Text(title), backgroundColor: context.bg),
      body: Center(
        child: Padding(
          padding: EdgeInsets.all(24.r),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 48.r, color: context.txtSec),
              SizedBox(height: 16.h),
              Text(
                '$title is not available yet.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: context.txtPri,
                  fontSize: 16.sp,
                  fontWeight: FontWeight.w600,
                ),
              ),
              SizedBox(height: 8.h),
              Text(
                message,
                textAlign: TextAlign.center,
                style: TextStyle(color: context.txtSec, fontSize: 13.sp),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
