import 'package:flutter/material.dart';
import 'admin_unavailable_screen.dart';

class CompletedTournamentDetailScreen extends StatelessWidget {
  const CompletedTournamentDetailScreen({super.key});
  @override
  Widget build(BuildContext context) => const AdminUnavailableScreen(
        title: 'Completed tournament',
        message: 'No completed tournament was supplied by the server.',
        icon: Icons.emoji_events_outlined,
      );
}
