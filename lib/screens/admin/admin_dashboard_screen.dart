import 'package:flutter/material.dart';
import 'admin_unavailable_screen.dart';

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});
  @override
  Widget build(BuildContext context) => const AdminUnavailableScreen(
        title: 'Admin dashboard',
        message:
            'Connect authenticated aggregate reporting before enabling dashboard metrics and activity.',
        icon: Icons.dashboard_outlined,
      );
}
