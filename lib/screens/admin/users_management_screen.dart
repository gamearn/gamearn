import 'package:flutter/material.dart';
import '../../theme.dart';

class UsersManagementScreen extends StatelessWidget {
  const UsersManagementScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
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
                    color: context.card,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: context.border),
                  ),
                  child: Icon(Icons.arrow_back_ios_new_rounded,
                      color: context.txtPri, size: 16),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text('Users Management',
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 17,
                        fontWeight: FontWeight.w800)),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: kCyan.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text('12,847',
                    style: TextStyle(
                        color: kCyan,
                        fontSize: 12,
                        fontWeight: FontWeight.w700)),
              ),
            ]),
          ),

          // Search
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: context.card,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: context.border),
              ),
              child: Row(children: [
                Icon(Icons.search_outlined,
                    color: context.txtSec, size: 20),
                SizedBox(width: 10),
                Expanded(
                    child: Text('Search users...',
                        style: TextStyle(
                            color: context.txtSec, fontSize: 14))),
                Icon(Icons.filter_list_outlined,
                    color: context.txtSec, size: 20),
              ]),
            ),
          ),

          const SizedBox(height: 12),

          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: 20,
              itemBuilder: (ctx, i) => _UserCard(
                name: 'User ${12847 - i}',
                email: 'user${12847 - i}@gamearn.com',
                status: i < 3 ? 'suspended' : 'active',
                role: i == 0 ? 'admin' : 'player',
                gamesPlayed: 120 - i * 7,
              ),
            ),
          ),
        ]),
      ),
    );
  }
}

class _UserCard extends StatelessWidget {
  final String name;
  final String email;
  final String status;
  final String role;
  final int gamesPlayed;

  const _UserCard({
    required this.name,
    required this.email,
    required this.status,
    required this.role,
    required this.gamesPlayed,
  });

  @override
  Widget build(BuildContext context) {
    final isActive = status == 'active';
    final isAdmin = role == 'admin';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.border),
      ),
      child: Row(children: [
        // Avatar
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: isAdmin ? kOrange.withOpacity(0.12) : kCyan.withOpacity(0.12),
            shape: BoxShape.circle,
          ),
          child: Icon(
            isAdmin ? Icons.admin_panel_settings : Icons.person_outline,
            color: isAdmin ? kOrange : kCyan,
            size: 22,
          ),
        ),
        const SizedBox(width: 12),
        // Info
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Text(name,
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 14,
                        fontWeight: FontWeight.w600)),
                if (isAdmin) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: kOrange.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text('ADMIN',
                        style: TextStyle(
                            color: kOrange,
                            fontSize: 8,
                            fontWeight: FontWeight.w800)),
                  ),
                ],
              ]),
              const SizedBox(height: 3),
              Text(email,
                  style: TextStyle(
                      color: context.txtSec, fontSize: 11)),
              const SizedBox(height: 3),
              Text('$gamesPlayed games played',
                  style: TextStyle(
                      color: context.txtSec, fontSize: 10)),
            ],
          ),
        ),
        // Status
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: isActive
                ? const Color(0xFF00E676).withOpacity(0.12)
                : Colors.redAccent.withOpacity(0.12),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(status.toUpperCase(),
              style: TextStyle(
                  color: isActive ? const Color(0xFF00E676) : Colors.redAccent,
                  fontSize: 9,
                  fontWeight: FontWeight.w700)),
        ),
      ]),
    );
  }
}
