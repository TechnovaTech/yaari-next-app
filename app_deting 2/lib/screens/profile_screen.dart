import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const bg = Color(0xFFFEF8F4);
    const tileBg = Color(0xFFFFEFE6);
    const accent = Color(0xFFFF8547);

    return Scaffold(
      backgroundColor: bg,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Back arrow only (no app bar title to match mock)
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back, color: Colors.black),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),

            const SizedBox(height: 8),

            // Avatar with edit icon overlay on corner
            Center(
              child: SizedBox(
                width: 120,
                height: 120,
                child: Stack(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/images/Avtar.png',
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              color: Colors.black12,
                              child: const Icon(Icons.person, size: 56, color: Colors.black45),
                            );
                          },
                        ),
                      ),
                    ),
                    Positioned(
                      right: 4,
                      bottom: 4,
                      child: InkWell(
                        onTap: () => Navigator.pushNamed(context, '/edit_profile'),
                        borderRadius: BorderRadius.circular(14),
                        child: Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: const [
                              BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 3)),
                            ],
                          ),
                          child: const Icon(Icons.edit, size: 16, color: Colors.black54),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 14),

            // Name (edit icon now moved to avatar corner)
            const Center(
              child: Text(
                'User Name',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.black),
              ),
            ),

            const SizedBox(height: 6),
            const Center(
              child: Text(
                '+91 9879879877',
                style: TextStyle(fontSize: 13, color: Colors.black54),
              ),
            ),

            const SizedBox(height: 24),

            // Action tiles
            _ActionTile(
              icon: Icons.view_list,
              label: 'Transaction History',
              onTap: () => Navigator.pushNamed(context, '/transaction_history'),
            ),
            const SizedBox(height: 14),
            _ActionTile(
              icon: Icons.call,
              label: 'Call History',
              onTap: () => Navigator.pushNamed(context, '/call_history'),
            ),
            const SizedBox(height: 14),
            _ActionTile(
              icon: Icons.privacy_tip,
              label: 'Privacy Policy',
              onTap: () => Navigator.pushNamed(context, '/privacy_policy'),
            ),
            const SizedBox(height: 14),
            _ActionTile(
              icon: Icons.headset_mic,
              label: 'Customer Support',
              onTap: () => Navigator.pushNamed(context, '/customer_support'),
            ),
            const SizedBox(height: 14),
            _ActionTile(
              icon: Icons.logout,
              label: 'Log Out',
              onTap: () => Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _ActionTile({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
        decoration: BoxDecoration(
          color: const Color(0xFFFFEFE6),
          borderRadius: BorderRadius.circular(18),
          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 12, offset: Offset(0, 6))],
        ),
        child: Row(
          children: [
            Icon(icon, color: Colors.black87),
            const SizedBox(width: 14),
            Text(
              label,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.black),
            ),
          ],
        ),
      ),
    );
  }
}