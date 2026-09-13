import 'package:flutter/material.dart';
import 'admin_unavailable_screen.dart';

class LiveUsersScreen extends StatelessWidget {
  const LiveUsersScreen({super.key});
  @override
  Widget build(BuildContext context) => const AdminUnavailableScreen(
        title: 'Live users',
        message:
            'Connect server presence reporting before displaying online users or game counts.',
        icon: Icons.wifi_tethering_rounded,
      );
}
