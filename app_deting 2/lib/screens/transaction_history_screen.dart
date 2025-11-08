import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class TransactionHistoryScreen extends StatelessWidget {
  const TransactionHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFEF8F4),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
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
                    'Transaction History',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w600,
                      color: Colors.black,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ],
              ),
            ),

            // Centered content (mobile perfectly centered)
            Expanded(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Prompt with bold 'transactions?'
                      Text.rich(
                        TextSpan(
                          children: const [
                            TextSpan(
                              text: 'Need help\nunderstanding\nyour ',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w600,
                                color: Colors.black54,
                                fontFamily: 'Poppins',
                              ),
                            ),
                            TextSpan(
                              text: 'transactions?',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w700,
                                color: Colors.black87,
                                fontFamily: 'Poppins',
                              ),
                            ),
                          ],
                        ),
                        textAlign: TextAlign.center,
                      ),

                      const SizedBox(height: 24),

                      // Explanation lines above email
                      const Text(
                        'If you have any questions or spot\nsomething unusual, please reach\nout to us at',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.black54,
                          fontFamily: 'Poppins',
                        ),
                      ),

                      const SizedBox(height: 6),

                      InkWell(
                        onTap: () async {
                          final uri = Uri(scheme: 'mailto', path: 'support@yaari.me');
                          await launchUrl(uri);
                        },
                        child: const Text(
                          'support@yaari.me',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Color(0xFFFF8547),
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Poppins',
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ),

                      const SizedBox(height: 6),

                      // Closing line
                      const Text(
                        'Our team is here to assist you.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.black54,
                          fontFamily: 'Poppins',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}