import 'package:flutter/material.dart';
import 'admin_unavailable_screen.dart';

class TournamentOverviewScreen extends StatelessWidget {
  const TournamentOverviewScreen({super.key});
  @override
  Widget build(BuildContext context) => const AdminUnavailableScreen(
        title: 'Tournament administration',
        message:
            'Connect the admin tournament API before displaying operational tournament records.',
        icon: Icons.emoji_events_outlined,
      );
}
