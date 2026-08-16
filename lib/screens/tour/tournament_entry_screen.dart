import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';
import '../wallet/buy_coins_screen.dart';
import 'live_tournament_screen.dart';

// ════════════════════════════════════════════════════════════════
//  TOURNAMENT ENTRY SCREEN — Figma matched
//  Node: 1665:913
//
//  Frame 56: pt=12 pb=16 px=24 | bg #0B0E1A | border-b #FFFFFF
//    "Tournament Created" fs18 w700 #F1F5F9 + back btn
//
//  Tournament Card (342×323 r12 bg #0F172A border #1E293B):
//    image 340×191 | "Pending..." fs12 #FFC107 (dot 8×8)
//    "Official" fs12 #22D1EE | title fs20 w700 #FFFFFF | sub fs12
//
//  Countdown (342×88 gap12): 3× 106×88 — box 106×64 r12 #0F172A/#1E293B
//    number fs20 w700 #FFFFFF + label fs12 #FFFFFF
//
//  Entry Fee Section (342×126 r12 #0F172A/#1E293B):
//    "ENTRY FEE" fs12 w700 #94A3B8 | ₦ + value fs48 + .00 — #FFC107 w700
//
//  Progress Section (342×117 r12 #1E293B):
//    "140 / 200 Units" fs14 #22D1EE
//    bar 308×12 r9999 #334155 | fill 216×12
//    caption fs10 #FFFFFF
//
//  Progress Ring (192×192): "150" fs32 #F1F5F9 / "Players joined" fs10 #64748B
//    divider / "75% FILLED" fs14 #22D1EE | caption "60 units left to Go Live"
//
//  Invite (342×59 r12 stroke #22D1EE): icon + "Invite Friends" fs18 #22D1EE
//
//  Expiry Rule (343×116): "Expiry Rule" fs16 #FFFFFF
//    Info Box 343×82 r8 #FF5E00: fs12 #FFFFFF
//
//  PAY & JOIN (342×56 r12 #FF5E00) fs16 #FFFFFF
//  "Secured by GamEarn Wallet" fs10 #FFFFFF
// ════════════════════════════════════════════════════════════════

const _cyan = Color(0xFF22D1EE);
const _orange = Color(0xFFFF5E00);
const _gold = Color(0xFFFFC107);

class TournamentEntryScreen extends StatefulWidget {
  final String tournamentId;
  final int entryFee;
  final String title;

  const TournamentEntryScreen({
    super.key,
    required this.tournamentId,
    required this.entryFee,
    required this.title,
  });

  @override
  State<TournamentEntryScreen> createState() => _TournamentEntryScreenState();
}

class _TournamentEntryScreenState extends State<TournamentEntryScreen>
    with SingleTickerProviderStateMixin {
  final int _coinBalance = 1240;
  bool _isLoading = false;

  late AnimationController _checkCtrl;
  late Animation<double> _checkAnim;

  int _totalSeconds = (23 * 3600) + (45 * 60) + 12;
  late Timer _timer;

  bool get _canAfford => _coinBalance >= widget.entryFee;

  @override
  void initState() {
    super.initState();
    _checkCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _checkAnim = CurvedAnimation(parent: _checkCtrl, curve: Curves.elasticOut);
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted && _totalSeconds > 0) setState(() => _totalSeconds--);
    });
  }

  @override
  void dispose() {
    _checkCtrl.dispose();
    _timer.cancel();
    super.dispose();
  }

  String _pad(int n) => n.toString().padLeft(2, '0');
  int get _h => _totalSeconds ~/ 3600;
  int get _m => (_totalSeconds % 3600) ~/ 60;
  int get _s => _totalSeconds % 60;

  Future<void> _payAndJoin() async {
    if (!_canAfford) {
      _showInsufficientCoinsSheet();
      return;
    }
    HapticFeedback.mediumImpact();
    setState(() => _isLoading = true);

    try {
      final uid = FirebaseAuth.instance.currentUser?.uid ?? '';
      await FirebaseFirestore.instance
          .collection('tournaments')
          .doc(widget.tournamentId)
          .update({'players': FieldValue.arrayUnion([uid])});
    } catch (_) {}

    await Future.delayed(const Duration(milliseconds: 1200));
    if (!mounted) return;
    setState(() => _isLoading = false);
    _showSuccessSheet();
  }

  void _showSuccessSheet() {
    HapticFeedback.heavyImpact();
    _checkCtrl.forward();

    showModalBottomSheet(
      context: context,
      isDismissible: false,
      enableDrag: false,
      isScrollControlled: true,
      backgroundColor: context.card,
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24.r))),
      builder: (ctx) => SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.fromLTRB(24.w, 32.h, 24.w, 48.h),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ScaleTransition(
                scale: _checkAnim,
                child: Container(
                  width: 80.w, height: 80.w,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _cyan.withOpacity(0.12),
                    border: Border.all(color: _cyan, width: 2),
                  ),
                  child: Icon(Icons.check_rounded,
                      color: _cyan, size: 40.w),
                ),
              ),
              SizedBox(height: 20.h),
              Text("You're In!",
                  style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 24.sp)),
              SizedBox(height: 8.h),
              Text('Successfully registered for\n${widget.title}',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white70, fontSize: 14.sp)),
              SizedBox(height: 6.h),
              Text('${widget.entryFee} coins deducted',
                  style: TextStyle(color: Colors.white38, fontSize: 12.sp)),
              SizedBox(height: 32.h),
              SizedBox(
                width: double.infinity, height: 50.h,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                      backgroundColor: _orange,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14.r)),
                      elevation: 0),
                  onPressed: () {
                    Navigator.pop(ctx);
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (_) => LiveTournamentScreen(
                          tournamentId: widget.tournamentId,
                          tournamentTitle: widget.title,
                        ),
                      ),
                    );
                  },
                  child: Text('Go to Tournament',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 15.sp)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showInsufficientCoinsSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.card,
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20.r))),
      builder: (ctx) => SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.fromLTRB(24.w, 28.h, 24.w, 40.h),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.monetization_on_rounded,
                  color: Colors.redAccent, size: 40.w),
              SizedBox(height: 12.h),
              Text('Not Enough Coins',
                  style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 18.sp)),
              SizedBox(height: 8.h),
              Text('You need ${widget.entryFee - _coinBalance} more coins.',
                  style: TextStyle(color: Colors.white54, fontSize: 13.sp)),
              SizedBox(height: 24.h),
              SizedBox(
                width: double.infinity, height: 50.h,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                      backgroundColor: _cyan,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12.r)),
                      elevation: 0),
                  onPressed: () {
                    Navigator.pop(ctx);
                    Navigator.push(context,
                        MaterialPageRoute(builder: (_) => const BuyCoinsScreen()));
                  },
                  child: Text('Buy Coins',
                      style: TextStyle(
                          color: Colors.black,
                          fontWeight: FontWeight.w800,
                          fontSize: 15.sp)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _invite() {
    HapticFeedback.selectionClick();
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
      content: Text('Share link coming soon!'),
      backgroundColor: _cyan,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Column(children: [
          const _Header(),
          Expanded(
            child: StreamBuilder<DocumentSnapshot>(
              stream: FirebaseFirestore.instance
                  .collection('tournaments')
                  .doc(widget.tournamentId)
                  .snapshots(),
              builder: (_, snap) {
                final d = (snap.hasData ? snap.data!.data() : null)
                        as Map<String, dynamic>? ??
                    {};
                final players =
                    (d['players'] as List?)?.cast<String>() ?? [];
                final maxP = d['maxPlayers'] as int? ?? 200;
                final joined = players.length;
                final filled = maxP == 0
                    ? 0
                    : ((joined / maxP) * 100).clamp(0, 100).toInt();
                final left = (maxP - joined).clamp(0, maxP);

                return ListView(
                  padding: EdgeInsets.fromLTRB(24.w, 0, 24.w, 32.h),
                  children: [
                    _TournamentCard(
                      title: widget.title,
                      gameKey: (d['gameType'] as String? ?? 'whot')
                          .toLowerCase(),
                    ),
                    SizedBox(height: 24.h),
                    _Countdown(h: _h, m: _m, s: _s, pad: _pad),
                    SizedBox(height: 24.h),
                    _EntryFeeSection(fee: widget.entryFee),
                    SizedBox(height: 24.h),
                    _ProgressSection(
                      joined: joined,
                      maxP: maxP,
                      filled: filled,
                    ),
                    SizedBox(height: 24.h),
                    _ProgressRingSection(
                      joined: joined,
                      filled: filled,
                      left: left,
                    ),
                    SizedBox(height: 24.h),
                    _InviteButton(onTap: _invite),
                    SizedBox(height: 24.h),
                    const _ExpiryRule(),
                    SizedBox(height: 24.h),
                    _PayButton(
                      isLoading: _isLoading,
                      onTap: _payAndJoin,
                    ),
                    SizedBox(height: 12.h),
                    Center(
                      child: Text('Secured by GamEarn Wallet',
                          style: TextStyle(
                              color: Colors.white, fontSize: 10.sp)),
                    ),
                  ],
                );
              },
            ),
          ),
        ]),
      ),
    );
  }
}

// ── Header (Frame 56) ─────────────────────────────────────────────
class _Header extends StatelessWidget {
  const _Header();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(24.w, 40.h, 24.w, 16.h),
      decoration: BoxDecoration(
        color: context.bg,
        border: Border(
            bottom: BorderSide(
                color: context.isDark ? Colors.white : context.border)),
      ),
      child: Row(children: [
        GestureDetector(
          onTap: () => Navigator.pop(context),
          child: Icon(Icons.close_rounded,
              color: const Color(0xFFF1F5F9), size: 20.w),
        ),
        SizedBox(width: 12.w),
        Text('Tournament Created',
            style: TextStyle(
                color: const Color(0xFFF1F5F9),
                fontSize: 18.sp,
                fontWeight: FontWeight.w700)),
      ]),
    );
  }
}

// ── Tournament Card ───────────────────────────────────────────────
class _TournamentCard extends StatelessWidget {
  final String title;
  final String gameKey;
  const _TournamentCard({required this.title, required this.gameKey});

  static const _assets = {
    'whot':     'assets/games/whot.jpg',
    'ludo':     'assets/games/ludo.png',
    'ayo':      'assets/games/ayo.jpg',
    'draughts': 'assets/games/draughts.jpg',
  };

  @override
  Widget build(BuildContext context) {
    final asset = _assets.entries
        .firstWhere((e) => gameKey.contains(e.key),
            orElse: () => _assets.entries.first)
        .value;

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(children: [
        Image.asset(asset,
            height: 191.h, width: double.infinity, fit: BoxFit.cover),
        Padding(
          padding: EdgeInsets.all(20.r),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Container(
                  width: 8.w, height: 8.w,
                  decoration: const BoxDecoration(
                      color: Color(0xFFFFC107),
                      shape: BoxShape.circle),
                ),
                SizedBox(width: 8.w),
                Text('Pending...',
                    style: TextStyle(
                        color: const Color(0xFFFFC107),
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w500)),
                const Spacer(),
                Icon(Icons.verified_rounded,
                    color: _cyan, size: 13.w),
                SizedBox(width: 4.w),
                Text('Official',
                    style: TextStyle(
                        color: _cyan,
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w500)),
              ]),
              SizedBox(height: 14.h),
              Text(title,
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 20.sp,
                      fontWeight: FontWeight.w700)),
              SizedBox(height: 6.h),
              Text('Join the elite circle of ${gameKey.toUpperCase()} masters.',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ]),
    );
  }
}

// ── Countdown Timer ───────────────────────────────────────────────
class _Countdown extends StatelessWidget {
  final int h, m, s;
  final String Function(int) pad;
  const _Countdown(
      {required this.h, required this.m, required this.s, required this.pad});

  @override
  Widget build(BuildContext context) {
    final cells = [
      (pad(h), 'Hours'),
      (pad(m), 'Minutes'),
      (pad(s), 'Seconds'),
    ];
    return Row(
      children: cells.map((c) {
        return Expanded(
          child: Column(children: [
            Container(
              height: 64.h,
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(12.r),
                border: Border.all(color: const Color(0xFF1E293B)),
              ),
              child: Center(
                child: Text(c.$1,
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 20.sp,
                        fontWeight: FontWeight.w700)),
              ),
            ),
            SizedBox(height: 8.h),
            Text(c.$2,
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 12.sp,
                    fontWeight: FontWeight.w500)),
          ]),
        );
      }).toList(),
    );
  }
}

// ── Entry Fee Section ─────────────────────────────────────────────
class _EntryFeeSection extends StatelessWidget {
  final int fee;
  const _EntryFeeSection({required this.fee});

  @override
  Widget build(BuildContext context) {
    final whole = fee.toString();
    return Container(
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('ENTRY FEE',
              style: TextStyle(
                  color: const Color(0xFF94A3B8),
                  fontSize: 12.sp,
                  fontWeight: FontWeight.w700)),
          SizedBox(height: 6.h),
          Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
            Text('₦',
                style: TextStyle(
                    color: _gold,
                    fontSize: 20.sp,
                    fontWeight: FontWeight.w700)),
            Text(whole,
                style: TextStyle(
                    color: _gold,
                    fontSize: 48.sp,
                    fontWeight: FontWeight.w700,
                    height: 1.1)),
            Text('.00',
                style: TextStyle(
                    color: _gold,
                    fontSize: 20.sp,
                    fontWeight: FontWeight.w700)),
          ]),
        ],
      ),
    );
  }
}

// ── Progress Section ──────────────────────────────────────────────
class _ProgressSection extends StatelessWidget {
  final int joined, maxP, filled;
  const _ProgressSection(
      {required this.joined, required this.maxP, required this.filled});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('$joined / $maxP Units',
              style: TextStyle(
                  color: _cyan,
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w600)),
          SizedBox(height: 10.h),
          ClipRRect(
            borderRadius: BorderRadius.circular(9999.r),
            child: LinearProgressIndicator(
              value: maxP == 0 ? 0 : joined / maxP,
              minHeight: 12,
              backgroundColor: const Color(0xFF334155),
              valueColor: const AlwaysStoppedAnimation<Color>(_cyan),
            ),
          ),
          SizedBox(height: 10.h),
          Text(
              'The tournament will unlock automatically once the pool is filled.',
              style: TextStyle(color: Colors.white, fontSize: 10.sp)),
        ],
      ),
    );
  }
}

// ── Progress Ring Section ─────────────────────────────────────────
class _ProgressRingSection extends StatelessWidget {
  final int joined, filled, left;
  const _ProgressRingSection(
      {required this.joined, required this.filled, required this.left});

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      SizedBox(
        width: 192.w, height: 192.w,
        child: Stack(alignment: Alignment.center, children: [
          SizedBox(
            width: 192.w, height: 192.w,
            child: CircularProgressIndicator(
              value: filled / 100,
              strokeWidth: 12,
              backgroundColor: const Color(0xFF1E293B),
              valueColor: const AlwaysStoppedAnimation<Color>(_cyan),
            ),
          ),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('$joined',
                  style: TextStyle(
                      color: const Color(0xFFF1F5F9),
                      fontSize: 32.sp,
                      fontWeight: FontWeight.w700)),
              Text('Players joined',
                  style: TextStyle(
                      color: const Color(0xFF64748B),
                      fontSize: 10.sp,
                      fontWeight: FontWeight.w700)),
              SizedBox(height: 6.h),
              Container(width: 32.w, height: 1.h, color: Colors.white24),
              SizedBox(height: 6.h),
              Text('$filled% FILLED',
                  style: TextStyle(
                      color: _cyan,
                      fontSize: 14.sp,
                      fontWeight: FontWeight.w700)),
            ],
          ),
        ]),
      ),
      SizedBox(height: 10.h),
      Text('$left units left to Go Live',
          style: TextStyle(
              color: Colors.white,
              fontSize: 12.sp,
              fontWeight: FontWeight.w500)),
    ]);
  }
}

// ── Invite Friends ────────────────────────────────────────────────
class _InviteButton extends StatelessWidget {
  final VoidCallback onTap;
  const _InviteButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 59.h,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(color: _cyan),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.group_add_rounded, color: _cyan, size: 20.w),
            SizedBox(width: 8.w),
            Text('Invite Friends',
                style: TextStyle(
                    color: _cyan,
                    fontSize: 18.sp,
                    fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

// ── Expiry Rule ───────────────────────────────────────────────────
class _ExpiryRule extends StatelessWidget {
  const _ExpiryRule();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Expiry Rule',
            style: TextStyle(
                color: Colors.white,
                fontSize: 16.sp,
                fontWeight: FontWeight.w700)),
        SizedBox(height: 8.h),
        Container(
          padding: EdgeInsets.all(16.r),
          decoration: BoxDecoration(
            color: _orange,
            borderRadius: BorderRadius.circular(8.r),
          ),
          child: Text(
              'If tournament DOES NOT reach 2× units in 24 hrs: Refund all participants and refund half of creation fee to the user that created the tournament.',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 12.sp,
                  fontWeight: FontWeight.w500,
                  height: 1.4)),
        ),
      ],
    );
  }
}

// ── PAY & JOIN Button ─────────────────────────────────────────────
class _PayButton extends StatelessWidget {
  final bool isLoading;
  final VoidCallback onTap;
  const _PayButton({required this.isLoading, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: Container(
        height: 56.h,
        decoration: BoxDecoration(
          color: _orange,
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: Center(
          child: isLoading
              ? SizedBox(
                  width: 22.w, height: 22.w,
                  child: const CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 2))
              : Text('PAY & JOIN TOURNAMENT',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 16.sp,
                      fontWeight: FontWeight.w700)),
        ),
      ),
    );
  }
}
