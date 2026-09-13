import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../theme.dart';

/// Administrative transaction reporting requires a paginated backend endpoint.
///
/// The previous implementation displayed hard-coded financial records. Keep an
/// honest unavailable state until that authenticated contract is implemented.
class TransactionsOverviewScreen extends StatelessWidget {
  const TransactionsOverviewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        title: const Text('Transactions Overview'),
        backgroundColor: context.bg,
      ),
      body: Center(
        child: Padding(
          padding: EdgeInsets.all(24.r),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.receipt_long_outlined,
                  size: 48.r, color: context.txtSec),
              SizedBox(height: 16.h),
              Text(
                'Transaction reporting is not available yet.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: context.txtPri,
                  fontSize: 16.sp,
                  fontWeight: FontWeight.w600,
                ),
              ),
              SizedBox(height: 8.h),
              Text(
                'No sample financial data is shown. Connect the admin reporting API before enabling this screen.',
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
