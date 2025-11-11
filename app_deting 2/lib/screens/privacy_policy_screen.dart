import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:app_deting/utils/translations.dart';
import 'package:app_deting/main.dart';

class PrivacyPolicyScreen extends StatefulWidget {
  const PrivacyPolicyScreen({super.key});

  static const accent = Color(0xFFFF8547);

  @override
  State<PrivacyPolicyScreen> createState() => _PrivacyPolicyScreenState();
}

class _PrivacyPolicyScreenState extends State<PrivacyPolicyScreen> {
  @override
  void initState() {
    super.initState();
    MyApp.languageNotifier.addListener(_onLanguageChange);
  }

  @override
  void dispose() {
    MyApp.languageNotifier.removeListener(_onLanguageChange);
    super.dispose();
  }

  void _onLanguageChange() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFEF8F4),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.black87),
                    onPressed: () => Navigator.pop(context),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    AppTranslations.get('privacy_terms'),
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w700,
                      color: Colors.black,
                    ),
                  ),
                ],
              ),
            ),
            // Two options only: Privacy Policy and Terms of Service
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                children: [
                  _MenuTile(
                    icon: Icons.privacy_tip,
                    label: AppTranslations.get('privacy_policy'),
                    onTap: () async {
                      final Uri privacyPolicyUrl = Uri.parse('https://yaari.me/privacy');
                      if (!await launchUrl(privacyPolicyUrl, mode: LaunchMode.inAppWebView)) {
                        throw Exception('Could not launch $privacyPolicyUrl');
                      }
                    },
                  ),
                  const SizedBox(height: 14),
                  _MenuTile(
                    icon: Icons.lock_outline,
                    label: AppTranslations.get('terms_of_service'),
                    onTap: () async {
                      final Uri termsOfServiceUrl = Uri.parse('https://yaari.me/terms');
                      if (!await launchUrl(termsOfServiceUrl, mode: LaunchMode.inAppWebView)) {
                        throw Exception('Could not launch $termsOfServiceUrl');
                      }
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _MenuTile({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFEAEAEA)),
        ),
        child: Row(
          children: [
            Icon(icon, color: PrivacyPolicyScreen.accent),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.black),
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.black26),
          ],
        ),
      ),
    );
  }
}