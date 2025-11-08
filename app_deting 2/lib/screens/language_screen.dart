import 'package:flutter/material.dart';

class LanguageScreen extends StatefulWidget {
  static const String routeName = '/language';
  const LanguageScreen({super.key});

  @override
  State<LanguageScreen> createState() => _LanguageScreenState();
}

class _LanguageScreenState extends State<LanguageScreen> {
  String? _selected; // 'en' or 'hi'

  void _onSelect(String code) {
    setState(() => _selected = code);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: const Color(0xFFFEF8F4),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with back arrow and title
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 16.0,
                vertical: 8,
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () => Navigator.pop(context),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Select Language',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.black,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Language choices
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                children: [
                  _ChoiceTile(
                    label: 'English',
                    selected: _selected == 'en',
                    onTap: () => _onSelect('en'),
                    outlined: true, // add border like Hindi
                  ),
                  const SizedBox(height: 16),
                  _ChoiceTile(
                    label: 'हिंदी',
                    selected: _selected == 'hi',
                    onTap: () => _onSelect('hi'),
                    outlined: true,
                  ),
                ],
              ),
            ),

            const Spacer(),

            // Next button bottom aligned
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
              child: SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF8547),
                    disabledBackgroundColor: const Color(0xFFFFC2A4),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  onPressed: _selected == null
                      ? null
                      : () {
                          Navigator.pushNamed(
                            context,
                            '/gender',
                            arguments: {'language': _selected},
                          );
                        },
                  child: const Text(
                    'Next',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      letterSpacing: 0.5,
                    ),
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

class _ChoiceTile extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final bool outlined;
  const _ChoiceTile({
    required this.label,
    required this.selected,
    required this.onTap,
    this.outlined = false,
  });

  @override
  Widget build(BuildContext context) {
    final baseColor = const Color(0xFFFFEDE2);
    final accent = const Color(0xFFFF8547);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 22),
        decoration: BoxDecoration(
          color: selected ? baseColor : const Color(0xFFFEF8F4),
          borderRadius: BorderRadius.circular(20),
          border: outlined
              ? Border.all(color: accent.withOpacity(0.6), width: 1.5)
              : null,
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: selected ? Colors.black : accent,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}