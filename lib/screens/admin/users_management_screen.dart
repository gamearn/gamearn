import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../theme.dart';

class UsersManagementScreen extends StatelessWidget {
  const UsersManagementScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Column(children: [
          // Header
          Padding(
            padding: EdgeInsets.fromLTRB(24.w, 40.h, 24.w, 16.h),
            child: Row(children: [
              GestureDetector(
                onTap: () => Navigator.maybePop(context),
                child: Container(
                  width: 40.w,
                  height: 40.h,
                  decoration: BoxDecoration(
                    color: context.card,
                    borderRadius: BorderRadius.circular(10.r),
                    border: Border.all(color: context.border),
                  ),
                  child: Icon(Icons.close_rounded,
                      color: Color(0xFFF1F5F9), size: 20.w),
                ),
              ),
              SizedBox(width: 14.w),
              Expanded(
                child: Text('Users Management',
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 17.sp,
                        fontWeight: FontWeight.w800)),
              ),
              Container(
                padding:
                    EdgeInsets.symmetric(horizontal: 10.w, vertical: 5.h),
                decoration: BoxDecoration(
                  color: kCyan.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8.r),
                ),
                child: Text('12,847',
                    style: TextStyle(
                        color: kCyan,
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w700)),
              ),
            ]),
          ),

          // Search
          Padding(
            padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 0.h),
            child: Container(
              padding:
                  EdgeInsets.symmetric(horizontal: 14.w, vertical: 10.h),
              decoration: BoxDecoration(
                color: context.card,
                borderRadius: BorderRadius.circular(12.r),
                border: Border.all(color: context.border),
              ),
              child: Row(children: [
                Icon(Icons.search_outlined,
                    color: context.txtSec, size: 20.w),
                SizedBox(width: 10.w),
                Expanded(
                    child: Text('Search users...',
                        style: TextStyle(
                            color: context.txtSec, fontSize: 14.sp))),
                Icon(Icons.filter_list_outlined,
                    color: context.txtSec, size: 20.w),
              ]),
            ),
          ),

          SizedBox(height: 12.h),

          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.symmetric(horizontal: 24.w),
              itemCount: 20,
              itemBuilder: (ctx, i) => _UserCard(
                name: 'User ${12847 - i}',
                email: 'user${12847 - i}@gamearn.com',
                status: i < 3 ? 'suspended' : 'active',
                role: i == 0 ? 'admin' : 'player',
                gamesPlayed: 120 - i * 7,
              ),
            ),
          ),
        ]),
      ),
    );
  }
}

class _UserCard extends StatelessWidget {
  final String name;
  final String email;
  final String status;
  final String role;
  final int gamesPlayed;

  const _UserCard({
    required this.name,
    required this.email,
    required this.status,
    required this.role,
    required this.gamesPlayed,
  });

  @override
  Widget build(BuildContext context) {
    final isActive = status == 'active';
    final isAdmin = role == 'admin';

    return Container(
      margin: EdgeInsets.only(bottom: 10.h),
      padding: EdgeInsets.all(14.r),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: context.border),
      ),
      child: Row(children: [
        // Avatar
        Container(
          width: 44.w,
          height: 44.h,
          decoration: BoxDecoration(
            color: isAdmin ? kOrange.withOpacity(0.12) : kCyan.withOpacity(0.12),
            shape: BoxShape.circle,
          ),
          child: Icon(
            isAdmin ? Icons.admin_panel_settings : Icons.person_outline,
            color: isAdmin ? kOrange : kCyan,
            size: 22.w,
          ),
        ),
        SizedBox(width: 12.w),
        // Info
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Text(name,
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 14.sp,
                        fontWeight: FontWeight.w600)),
                if (isAdmin) ...[
                  SizedBox(width: 6.w),
                  Container(
                    padding: EdgeInsets.symmetric(
                        horizontal: 6.w, vertical: 2.h),
                    decoration: BoxDecoration(
                      color: kOrange.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(4.r),
                    ),
                    child: Text('ADMIN',
                        style: TextStyle(
                            color: kOrange,
                            fontSize: 8.sp,
                            fontWeight: FontWeight.w800)),
                  ),
                ],
              ]),
              SizedBox(height: 3.h),
              Text(email,
                  style: TextStyle(
                      color: context.txtSec, fontSize: 11.sp)),
              SizedBox(height: 3.h),
              Text('$gamesPlayed games played',
                  style: TextStyle(
                      color: context.txtSec, fontSize: 10.sp)),
            ],
          ),
        ),
        // Status
        Container(
          padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
          decoration: BoxDecoration(
            color: isActive
                ? const Color(0xFF22C55E).withOpacity(0.12)
                : Colors.redAccent.withOpacity(0.12),
            borderRadius: BorderRadius.circular(6.r),
          ),
          child: Text(status.toUpperCase(),
              style: TextStyle(
                  color: isActive ? const Color(0xFF22C55E) : Colors.redAccent,
                  fontSize: 9.sp,
                  fontWeight: FontWeight.w700)),
        ),
      ]),
    );
  }
}
