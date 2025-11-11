import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:app_deting/utils/translations.dart';
import 'package:app_deting/main.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  static const String _apiBase = 'https://admin.yaari.me';

  String _name = 'User Name';
  String _phone = '';
  String _avatarUrl = '';
  String? _gender;

  @override
  void initState() {
    super.initState();
    MyApp.languageNotifier.addListener(_onLanguageChange);
    _loadProfile();
  }

  @override
  void dispose() {
    MyApp.languageNotifier.removeListener(_onLanguageChange);
    super.dispose();
  }

  void _onLanguageChange() {
    if (mounted) setState(() {});
  }

  String _normalizeUrl(String? url) {
    final u = (url ?? '').trim();
    if (u.isEmpty) return '';
    // Normalize local hosts to production base
    String normalized = u
        .replaceAll(RegExp(r'https?://localhost:\d+'), _apiBase)
        .replaceAll(RegExp(r'https?://0\.0\.0\.0:\d+'), _apiBase);
    // If server returned an admin upload path, prefix with base
    if (normalized.startsWith('/uploads/')) {
      normalized = '$_apiBase$normalized';
    }
    return normalized;
  }

  Future<void> _loadProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('user');
      Map<String, dynamic> root = <String, dynamic>{};
      if (raw != null && raw.isNotEmpty) {
        try {
          final decoded = jsonDecode(raw);
          if (decoded is Map<String, dynamic>) {
            root = decoded;
          }
        } catch (_) {}
      }

      // Some responses store the user under `user`, others under `data.user`,
      // and some put fields directly under `data` or at root.
      final Map<String, dynamic> data = (root['data'] is Map<String, dynamic>)
          ? (root['data'] as Map<String, dynamic>)
          : <String, dynamic>{};
      final Map<String, dynamic> user = (root['user'] is Map<String, dynamic>)
          ? (root['user'] as Map<String, dynamic>)
          : (data['user'] is Map<String, dynamic>)
              ? (data['user'] as Map<String, dynamic>)
              : (data.isNotEmpty ? data : root);

      final String name = (user['name'] ?? user['username'] ?? 'User Name').toString();
      String phone = (user['phone'] ?? prefs.getString('phone') ?? '').toString();
      String avatar = (user['profilePic'] ?? user['avatar'] ?? user['image'] ?? '').toString();
      avatar = _normalizeUrl(avatar);
      final String? gender = (user['gender'] ?? prefs.getString('gender'))?.toString().toLowerCase();

      setState(() {
        _name = name.isEmpty ? 'User Name' : name;
        _phone = phone;
        _avatarUrl = avatar;
        _gender = gender;
      });

      // Try to fetch latest profile image from server using user ID
      final String id = (user['id'] ?? user['_id'] ?? '').toString();
      if (id.isNotEmpty) {
        try {
          final uri = Uri.parse('$_apiBase/api/users/$id/images');
          final res = await http.get(uri);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            final dynamic decoded = jsonDecode(res.body);
            final Map<String, dynamic> body = decoded is Map<String, dynamic>
                ? decoded
                : <String, dynamic>{};
            final Map<String, dynamic> data = body['data'] is Map<String, dynamic>
                ? (body['data'] as Map<String, dynamic>)
                : body;
            final String serverPic = _normalizeUrl(
              (data['profilePic'] ?? data['avatar'] ?? data['image'] ?? '').toString(),
            );
            if (serverPic.isNotEmpty && serverPic != _avatarUrl) {
              if (!mounted) return;
              setState(() => _avatarUrl = serverPic);
            }
          }
        } catch (_) {}
      }
    } catch (_) {
      // ignore
    }
  }

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
                        child: _avatarUrl.isNotEmpty
                            ? Image.network(
                                _avatarUrl,
                                fit: BoxFit.cover,
                                width: 120,
                                height: 120,
                                errorBuilder: (context, error, stackTrace) {
                                  return Image.asset(
                                    (_gender == 'female') ? 'assets/images/favatar.png' : 'assets/images/Avtar.png',
                                    fit: BoxFit.cover,
                                    width: 120,
                                    height: 120,
                                  );
                                },
                              )
                            : Image.asset(
                                (_gender == 'female') ? 'assets/images/favatar.png' : 'assets/images/Avtar.png',
                                fit: BoxFit.cover,
                                width: 120,
                                height: 120,
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
            Center(
              child: Text(
                _name,
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.black),
              ),
            ),

            const SizedBox(height: 6),
            Center(
              child: Text(
                _phone.isNotEmpty ? _phone : '+91 9879879877',
                style: const TextStyle(fontSize: 13, color: Colors.black54),
              ),
            ),

            const SizedBox(height: 24),

            // Action tiles
            _ActionTile(
              icon: Icons.view_list,
              label: AppTranslations.get('transaction_history'),
              onTap: () => Navigator.pushNamed(context, '/transaction_history'),
            ),
            const SizedBox(height: 14),
            _ActionTile(
              icon: Icons.call,
              label: AppTranslations.get('call_history'),
              onTap: () => Navigator.pushNamed(context, '/call_history'),
            ),
            const SizedBox(height: 14),
            _ActionTile(
              icon: Icons.privacy_tip,
              label: AppTranslations.get('privacy_policy'),
              onTap: () => Navigator.pushNamed(context, '/privacy_policy'),
            ),
            const SizedBox(height: 14),
            _ActionTile(
              icon: Icons.headset_mic,
              label: AppTranslations.get('customer_support'),
              onTap: () => Navigator.pushNamed(context, '/customer_support'),
            ),
            const SizedBox(height: 14),
            _ActionTile(
              icon: Icons.logout,
              label: AppTranslations.get('logout'),
              onTap: () async {
                final prefs = await SharedPreferences.getInstance();
                await prefs.remove('user');
                await prefs.remove('phone');
                await prefs.remove('language');
                await prefs.remove('gender');
                // Optionally clear session-specific values
                // await prefs.remove('gender');
                if (context.mounted) {
                  Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
                }
              },
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