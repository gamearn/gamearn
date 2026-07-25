import 'package:flutter/material.dart';
import '../../theme.dart';

class LanguageScreen extends StatefulWidget {
  const LanguageScreen({super.key});

  @override
  State<LanguageScreen> createState() => _LanguageScreenState();
}

class _LanguageScreenState extends State<LanguageScreen> {
  String _selected = 'English';

  final _languages = const [
    {'name': 'English', 'flag': '🇬🇧'},
    {'name': 'Yoruba', 'flag': '🇳🇬'},
    {'name': 'Igbo', 'flag': '🇳🇬'},
    {'name': 'Hausa', 'flag': '🇳🇬'},
    {'name': 'Pidgin', 'flag': '🇳🇬'},
  ];

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: const Color(0xFF0B0E1A),
        body: SafeArea(
          child: Column(children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(children: [
                GestureDetector(
                  onTap: () => Navigator.maybePop(context),
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF334155)),
                    ),
                    child: const Icon(Icons.arrow_back_ios_new_rounded,
                        color: Colors.white, size: 16),
                  ),
                ),
                const SizedBox(width: 14),
                const Text('Language',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.w800)),
              ]),
            ),

            const SizedBox(height: 20),

            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _languages.length,
                itemBuilder: (ctx, i) {
                  final lang = _languages[i];
                  final selected = _selected == lang['name'];
                  return GestureDetector(
                    onTap: () => setState(() => _selected = lang['name']!),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 16),
                      decoration: BoxDecoration(
                        color: selected
                            ? kCyan.withOpacity(0.08)
                            : const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: selected ? kCyan : const Color(0xFF334155),
                          width: selected ? 1.5 : 1,
                        ),
                      ),
                      child: Row(children: [
                        Text(lang['flag']!,
                            style: const TextStyle(fontSize: 24)),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(lang['name']!,
                              style: TextStyle(
                                  color: selected ? kCyan : Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600)),
                        ),
                        if (selected)
                          const Icon(Icons.check_circle_rounded,
                              color: kCyan, size: 22)
                        else
                          const Icon(Icons.radio_button_unchecked,
                              color: Color(0xFF475569), size: 22),
                      ]),
                    ),
                  );
                },
              ),
            ),

            // Save button
            Padding(
              padding: EdgeInsets.fromLTRB(
                  16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () {
                    // TODO: persist language choice
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                      content: Text('Language set to $_selected'),
                      backgroundColor: kCyan,
                      behavior: SnackBarBehavior.floating,
                    ));
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kCyan,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: const Text('Save',
                      style: TextStyle(
                          color: Color(0xFF0B0E1A),
                          fontWeight: FontWeight.w800,
                          fontSize: 15)),
                ),
              ),
            ),
          ]),
        ),
      );
}
