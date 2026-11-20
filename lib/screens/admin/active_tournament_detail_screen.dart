import 'package:flutter/material.dart';
import 'admin_unavailable_screen.dart';

class ActiveTournamentDetailScreen extends StatelessWidget {
  const ActiveTournamentDetailScreen({super.key});
  @override
  Widget build(BuildContext context) => const AdminUnavailableScreen(
        title: 'Active tournament',
        message: 'No active tournament was supplied by the server.',
        icon: Icons.play_circle_outline_rounded,
      );
}
