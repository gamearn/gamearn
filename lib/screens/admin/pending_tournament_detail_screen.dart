import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../theme.dart';

class PendingTournamentDetailScreen extends StatelessWidget {
  const PendingTournamentDetailScreen({super.key});

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
                  height: 40.w,
                  decoration: BoxDecoration(
                    color: context.card,
                    borderRadius: BorderRadius.circular(10).r,
                    border: Border.all(color: context.border),
                  ),
                  child: Icon(Icons.close_rounded,
                      color: Color(0xFFF1F5F9), size: 20.w),
                ),
              ),
              SizedBox(width: 14.w),
              Expanded(
                child: Text('Pending Tournament',
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 17.sp,
                        fontWeight: FontWeight.w800)),
              ),
              Container(
                padding:
                    EdgeInsets.symmetric(horizontal: 10.w, vertical: 5.h),
                decoration: BoxDecoration(
                  color: kOrange.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8).r,
                ),
                child: Text('PENDING',
                    style: TextStyle(
                        color: kOrange,
                        fontSize: 11.sp,
                        fontWeight: FontWeight.w800)),
              ),
            ]),
          ),

          Expanded(
            child: ListView(
              padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 0),
              children: [
                // Tournament info
                Container(
                  padding: EdgeInsets.all(16.r),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        kOrange.withOpacity(0.08),
                        context.card,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14).r,
                    border: Border.all(color: kOrange.withOpacity(0.25)),
                  ),
                  child: Column(children: [
                    Text('Ayo Masters Cup #12',
                        style: TextStyle(
                            color: context.txtPri,
                            fontSize: 17.sp,
                            fontWeight: FontWeight.w800)),
                    SizedBox(height: 12.h),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _info(context, 'Prize Pool', '\u20A630,000'),
                        _info(context, 'Entry Fee', '\u20A6500'),
                        _info(context, 'Players', '18/32'),
                      ],
                    ),
                    SizedBox(height: 12.h),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _info(context, 'Starts In', '2h 15m'),
                        _info(context, 'Game', 'Ayo'),
                        _info(context, 'Format', 'Single Elim'),
                      ],
                    ),
                  ]),
                ),

                SizedBox(height: 20.h),

                // Registered players
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('REGISTERED PLAYERS (18)',
                        style: TextStyle(
                            color: context.txtSec,
                            fontSize: 11.sp,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.2)),
                    TextButton(
                      onPressed: () {},
                      child: Text('View All',
                          style: TextStyle(color: kCyan, fontSize: 12.sp)),
                    ),
                  ],
                ),
                SizedBox(height: 6.h),
                _SectionCard(children: [
                  for (int i = 0; i < 8; i++)
                    _PlayerRow(
                      name: 'Player ${1800 - i * 10}',
                      rank: i + 1,
                    ),
                ]),

                SizedBox(height: 20.h),

                // Config review
                Text('TOURNAMENT CONFIG',
                    style: TextStyle(
                        color: context.txtSec,
                        fontSize: 11.sp,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2)),
                SizedBox(height: 10.h),
                _SectionCard(children: [
                  _ConfigRow('Max Players', '32'),
                  _divider(context),
                  _ConfigRow('Entry Fee', '\u20A6500'),
                  _divider(context),
                  _ConfigRow('Prize Distribution', '1st: \u20A620K, 2nd: \u20A67K, 3rd: \u20A63K'),
                  _divider(context),
                  _ConfigRow('Match Timer', '120 seconds'),
                ]),

                SizedBox(height: 20.h),

                // Admin actions
                Row(children: [
                  Expanded(
                    child: SizedBox(
                      height: 48.h,
                      child: ElevatedButton(
                        onPressed: () {
                          // TODO: start tournament
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF22C55E),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12).r),
                        ),
                        child: Text('Start Tournament',
                            style: TextStyle(
                                color: Colors.black,
                                fontWeight: FontWeight.w800,
                                fontSize: 14.sp)),
                      ),
                    ),
                  ),
                  SizedBox(width: 10.w),
                  Expanded(
                    child: SizedBox(
                      height: 48.h,
                      child: OutlinedButton(
                        onPressed: () {
                          // TODO: edit tournament
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: context.txtPri,
                          side: BorderSide(color: context.border),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12).r),
                        ),
                        child: Text('Edit',
                            style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 14.sp)),
                      ),
                    ),
                  ),
                ]),

                SizedBox(height: 32.h),
              ],
            ),
          ),
        ]),
      ),
    );
  }

  Widget _info(BuildContext context, String label, String value) {
    return Column(children: [
      Text(label,
          style:
              TextStyle(color: context.txtSec, fontSize: 10.sp)),
      SizedBox(height: 2.h),
      Text(value,
          style: TextStyle(
              color: context.txtPri,
              fontSize: 14.sp,
              fontWeight: FontWeight.w800)),
    ]);
  }

  Widget _divider(BuildContext context) =>
      Divider(height: 1, indent: 56, color: context.border);
}

class _SectionCard extends StatelessWidget {
  final List<Widget> children;
  const _SectionCard({required this.children});

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          color: context.card,
          borderRadius: BorderRadius.circular(12).r,
        ),
        child: Column(children: children),
      );
}

class _PlayerRow extends StatelessWidget {
  final String name;
  final int rank;

  const _PlayerRow({required this.name, required this.rank});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding:
          EdgeInsets.symmetric(horizontal: 14.w, vertical: 2.h),
      leading: Container(
        width: 28.w,
        height: 28.w,
        decoration: BoxDecoration(
          color: rank <= 3 ? kCyan.withOpacity(0.12) : kBgCardAlt,
          shape: BoxShape.circle,
        ),
        child: Center(
          child: Text('$rank',
              style: TextStyle(
                  color: rank <= 3 ? kCyan : kTextSec,
                  fontSize: 12.sp,
                  fontWeight: FontWeight.w700)),
        ),
      ),
      title: Text(name,
          style: TextStyle(
              color: context.txtPri,
              fontSize: 13.sp,
              fontWeight: FontWeight.w500)),
      trailing: Icon(Icons.chevron_right_rounded,
          color: context.txtSec, size: 18.w),
    );
  }
}

class _ConfigRow extends StatelessWidget {
  final String label;
  final String value;

  const _ConfigRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding:
          EdgeInsets.symmetric(horizontal: 14.w, vertical: 2.h),
      title: Text(label,
          style: TextStyle(
              color: context.txtSec, fontSize: 13.sp)),
      trailing: Text(value,
          style: TextStyle(
              color: context.txtPri,
              fontSize: 13.sp,
              fontWeight: FontWeight.w600)),
    );
  }
}
