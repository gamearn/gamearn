import 'package:flutter/material.dart';
import 'admin_unavailable_screen.dart';

class CompletedGamesScreen extends StatelessWidget {
  const CompletedGamesScreen({super.key});
  @override
  Widget build(BuildContext context) => const AdminUnavailableScreen(
        title: 'Completed games',
        message:
            'Connect authenticated game-history reporting before displaying completed matches.',
        icon: Icons.sports_esports_outlined,
      );
}
