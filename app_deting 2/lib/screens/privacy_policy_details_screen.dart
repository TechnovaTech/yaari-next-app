import 'package:flutter/material.dart';

class PrivacyPolicyDetailsScreen extends StatelessWidget {
  const PrivacyPolicyDetailsScreen({super.key});

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
                  const Text(
                    'Privacy Policy',
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: Colors.black),
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: const Text(
                  'We collect basic account details (name, phone), usage data (interactions, call time), and device info to provide and improve Yaari. We do not sell your data and only share limited info with trusted providers as needed.',
                  style: TextStyle(fontSize: 14, color: Colors.black87),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}