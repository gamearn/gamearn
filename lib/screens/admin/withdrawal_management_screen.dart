import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../theme.dart';

/// Withdrawal approval must operate on server-authoritative requests.
///
/// This state prevents administrators from mistaking local sample entries or
/// local-only approval buttons for real financial operations.
class WithdrawalManagementScreen extends StatelessWidget {
  const WithdrawalManagementScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        title: const Text('Withdrawal Management'),
        backgroundColor: context.bg,
      ),
      body: Center(
        child: Padding(
          padding: EdgeInsets.all(24.r),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.account_balance_outlined,
                  size: 48.r, color: context.txtSec),
              SizedBox(height: 16.h),
              Text(
                'Withdrawal management is not available yet.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: context.txtPri,
                  fontSize: 16.sp,
                  fontWeight: FontWeight.w600,
                ),
              ),
              SizedBox(height: 8.h),
              Text(
                'Use the secured backend workflow after the admin withdrawal API is connected.',
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
