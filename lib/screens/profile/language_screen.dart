import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gamearn/l10n/app_localizations.dart';
import '../../theme.dart';
import '../../services/language_service.dart';

// ════════════════════════════════════════════════════════════════
//  SELECT LANGUAGE SCREEN — Figma matched (2110:3215, 390×844)
//
//  Search: 343×56 #353535@30 · "Search for a language" fs16
//    #FFFFFF@60
//  Suggested: English (US) fs18 w700 + sub "Default system
//    language" fs12 #FFFFFF@60 · selected row #22D1EE@10, radio 24
//  All Languages: French / Spanish fs18 w500 + radio 24 outline
//  Save: 343×56 #FF5E00 · footer "Secured by Gamearn" fs12 #475569
// ════════════════════════════════════════════════════════════════

class LanguageScreen extends StatefulWidget {
  const LanguageScreen({super.key});

  @override
  State<LanguageScreen> createState() => _LanguageScreenState();
}

class _LanguageScreenState extends State<LanguageScreen> {
  String _selected = LanguageService.instance.languageCode;
  final _searchCtrl = TextEditingController();

  static const _languages = <String>[
    AppLanguage.french,
    AppLanguage.spanish,
  ];

  String _displayName(String code) => AppLanguage.displayName(code);

  List<String> get _filtered {
    final q = _searchCtrl.text.trim().toLowerCase();
    if (q.isEmpty) return _languages;
    return _languages.where((l) => _displayName(l).toLowerCase().contains(q)).toList();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
    backgroundColor: context.bg,
    body: SafeArea(
      child: Column(children: [
        // Header — Figma Frame 56: "Select Language"
        Container(
          width: double.infinity,
          padding: EdgeInsets.fromLTRB(24.w, 40.h, 24.w, 16.h),
          decoration: BoxDecoration(
            color: context.bg,
            border: Border(bottom: BorderSide(color: context.border, width: 1)),
          ),
          child: Row(children: [
            GestureDetector(
              onTap: () => Navigator.maybePop(context),
              child: Icon(Icons.close_rounded,
                  color: context.txtPri, size: 20.w),
            ),
            Expanded(
              child: Text(l10n.languageTitle,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: context.txtPri,
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
                      color: context.txtSec, size: 20.w),
                  SizedBox(width: 12.w),
                  Expanded(
                    child: TextField(
                      controller: _searchCtrl,
                      onChanged: (_) => setState(() {}),
                      style: TextStyle(
                          color: context.txtPri, fontSize: 16.sp),
                      decoration: InputDecoration(
                        hintText: l10n.languageSearchHint,
                        hintStyle: TextStyle(
                            color: context.txtSec, fontSize: 16.sp),
                        border: InputBorder.none,
                        isDense: true,
                      ),
                    ),
                  ),
                ]),
              ),

              SizedBox(height: 24.h),

              // ── SUGGESTED ─────────────────────────────────────────────
              Text(l10n.languageSuggested,
                  style: TextStyle(
                      color: context.txtSec, fontSize: 12.sp,
                      fontWeight: FontWeight.w500)),
              SizedBox(height: 10.h),
              _langRow(
                name: l10n.languageEnglishUs,
                sub: l10n.languageDefaultSystem,
                selected: _selected == AppLanguage.english,
                onTap: () => setState(() => _selected = AppLanguage.english),
              ),

              SizedBox(height: 24.h),

              // ── ALL LANGUAGES ─────────────────────────────────────────
              Text(l10n.languageAll,
                  style: TextStyle(
                      color: context.txtSec, fontSize: 12.sp,
                      fontWeight: FontWeight.w500)),
              SizedBox(height: 10.h),
              ..._filtered.map((lang) => _langRow(
                    name: _displayName(lang),
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
                onPressed: () async {
                  await LanguageService.instance.setLanguage(_selected);
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                    content: Text(l10n.languageSetTo(_displayName(_selected))),
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
                child: Text(l10n.save,
                    style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 16.sp)),
              ),
            ),
            SizedBox(height: 24.h),
            Text(l10n.secByGamearn,
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: context.txtSec, fontSize: 12.sp,
                    fontWeight: FontWeight.w400)),
            SizedBox(height: 12.h),
          ]),
        ),
      ]),
    ),
  );
  }

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
                      color: context.txtPri,
                      fontSize: 18.sp, fontWeight: FontWeight.w700)),
              if (sub != null) ...[
                SizedBox(height: 3.h),
                Text(sub,
                    style: TextStyle(
                        color: context.txtSec, fontSize: 12.sp,
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
                color: context.txtPri, size: 24.w),
      ]),
    ),
  );
}
