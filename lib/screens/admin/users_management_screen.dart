import 'package:flutter/material.dart';
import 'admin_unavailable_screen.dart';

class UsersManagementScreen extends StatelessWidget {
  const UsersManagementScreen({super.key});
  @override
  Widget build(BuildContext context) => const AdminUnavailableScreen(
        title: 'User management',
        message:
            'Connect the paginated admin user API before displaying or changing user accounts.',
        icon: Icons.people_outline_rounded,
      );
}
