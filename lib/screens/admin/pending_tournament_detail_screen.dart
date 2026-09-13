import 'package:flutter/material.dart';
import 'admin_unavailable_screen.dart';

class PendingTournamentDetailScreen extends StatelessWidget {
  const PendingTournamentDetailScreen({super.key});
  @override
  Widget build(BuildContext context) => const AdminUnavailableScreen(
        title: 'Pending tournament',
        message: 'No tournament was supplied by the server.',
        icon: Icons.schedule_rounded,
      );
}
