import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../theme.dart';

// ════════════════════════════════════════════════════════════════
//  SELECT LANGUAGE SCREEN — Figma matched (2110:3215, 390×844)
//
//  Search: 343×56 #353535@30 · "Search for a language" fs16
//    #FFFFFF@60
//  Suggested: English (US) fs18 w700 + sub "Default system
//    language" fs12 #FFFFFF@60 · selected row #22D1EE@10, radio 24
//  All Languages: Spanish / French / German / Chinese (Simplified)
//    / Japanese / Portuguese fs18 w500 + radio 24 outline
//  Save: 343×56 #FF5E00 · footer "Secured by Gamearn" fs12 #475569
// ════════════════════════════════════════════════════════════════

class LanguageScreen extends StatefulWidget {
  const LanguageScreen({super.key});

  @override
  State<LanguageScreen> createState() => _LanguageScreenState();
}

class _LanguageScreenState extends State<LanguageScreen> {
  String _selected = 'English (US)';
  final _searchCtrl = TextEditingController();

  static const _languages = [
    'Spanish', 'French', 'German',
    'Chinese (Simplified)', 'Japanese', 'Portuguese',
  ];

  List<String> get _filtered {
    final q = _searchCtrl.text.trim().toLowerCase();
    if (q.isEmpty) return _languages;
    return _languages.where((l) => l.toLowerCase().contains(q)).toList();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: context.bg,
    body: SafeArea(
      child: Column(children: [
        // Header — Figma Frame 56: "Select Language"
        Container(
          width: double.infinity,
          padding: EdgeInsets.fromLTRB(24.w, 40.h, 24.w, 16.h),
          decoration: const BoxDecoration(
            color: Color(0xE60B0E1A),
            border: Border(bottom: BorderSide(color: Color(0x4DFFFFFF), width: 1)),
          ),
          child: Row(children: [
            GestureDetector(
              onTap: () => Navigator.maybePop(context),
              child: Icon(Icons.close_rounded,
                  color: Color(0xFFF1F5F9), size: 20.w),
            ),
            Expanded(
              child: Text('Select Language',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: Color(0xFFF1F5F9),
                      fontSize: 18.sp, fontWeight: FontWeight.w700)),
            ),
            SizedBox(width: 20.w),
          ]),
        ),

        Expanded(
          child: ListView(
            padding: EdgeInsets.symmetric(horizontal: 24.w),
            children: [

              SizedBox(height: 32.h),

              // ── SEARCH — Figma: 343×56 #353535@30 rx8 ──────────────────
              Container(
                height: 56.h,
                padding: EdgeInsets.symmetric(horizontal: 16.w),
                decoration: BoxDecoration(
                  color: const Color(0x4D353535),
                  borderRadius: BorderRadius.circular(8.r),
                ),
                child: Row(children: [
                  Icon(Icons.search_rounded,
                      color: Color(0x99FFFFFF), size: 20.w),
                  SizedBox(width: 12.w),
                  Expanded(
                    child: TextField(
                      controller: _searchCtrl,
                      onChanged: (_) => setState(() {}),
                      style: TextStyle(
                          color: Colors.white, fontSize: 16.sp),
                      decoration: InputDecoration(
                        hintText: 'Search for a language',
                        hintStyle: TextStyle(
                            color: Color(0x99FFFFFF), fontSize: 16.sp),
                        border: InputBorder.none,
                        isDense: true,
                      ),
                    ),
                  ),
                ]),
              ),

              SizedBox(height: 24.h),

              // ── SUGGESTED ─────────────────────────────────────────────
              Text('Suggested',
                  style: TextStyle(
                      color: Color(0x99FFFFFF), fontSize: 12.sp,
                      fontWeight: FontWeight.w500)),
              SizedBox(height: 10.h),
              _langRow(
                name: 'English (US)',
                sub: 'Default system language',
                selected: _selected == 'English (US)',
                onTap: () => setState(() => _selected = 'English (US)'),
              ),

              SizedBox(height: 24.h),

              // ── ALL LANGUAGES ─────────────────────────────────────────
              Text('All Languages',
                  style: TextStyle(
                      color: Color(0x99FFFFFF), fontSize: 12.sp,
                      fontWeight: FontWeight.w500)),
              SizedBox(height: 10.h),
              ..._filtered.map((lang) => _langRow(
                    name: lang,
                    selected: _selected == lang,
                    onTap: () => setState(() => _selected = lang),
                  )),

              SizedBox(height: 28.h),
            ],
          ),
        ),

        // ── SAVE — Figma: 343×56 #FF5E00, footer "Secured by Gamearn" CENTER ──
        Padding(
          padding: EdgeInsets.fromLTRB(24.w, 0, 24.w, 0),
          child: Column(children: [
            SizedBox(
              width: double.infinity,
              height: 56.h,
              child: ElevatedButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                    content: Text('Language set to $_selected'),
                    backgroundColor: kOrange,
                    behavior: SnackBarBehavior.floating,
                  ));
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: kOrange,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12.r)),
                  elevation: 0,
                ),
                child: Text('Save',
                    style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 16.sp)),
              ),
            ),
            SizedBox(height: 24.h),
            Text('Secured by Gamearn',
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: Color(0xFF475569), fontSize: 12.sp,
                    fontWeight: FontWeight.w400)),
            SizedBox(height: 12.h),
          ]),
        ),
      ]),
    ),
  );

  Widget _langRow({
    required String name,
    String? sub,
    required bool selected,
    required VoidCallback onTap,
  }) => GestureDetector(
    onTap: onTap,
    child: Container(
      margin: EdgeInsets.only(bottom: 16.h),
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: selected ? kCyan.withOpacity(0.1) : Colors.transparent,
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Row(children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name,
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 18.sp, fontWeight: FontWeight.w700)),
              if (sub != null) ...[
                SizedBox(height: 3.h),
                Text(sub,
                    style: TextStyle(
                        color: Color(0x99FFFFFF), fontSize: 12.sp,
                        fontWeight: FontWeight.w500)),
              ],
            ],
          ),
        ),
        // Radio — Figma: 24×24 (selected #22D1EE, outline white)
        selected
            ? Icon(Icons.check_circle_rounded,
                color: kCyan, size: 24.w)
            : Icon(Icons.radio_button_unchecked_rounded,
                color: Colors.white, size: 24.w),
      ]),
    ),
  );
}
