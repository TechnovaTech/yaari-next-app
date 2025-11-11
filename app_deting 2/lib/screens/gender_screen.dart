import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:app_deting/models/profile_store.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:app_deting/utils/translations.dart';

class GenderScreen extends StatefulWidget {
  static const String routeName = '/gender';
  const GenderScreen({super.key});

  @override
  State<GenderScreen> createState() => _GenderScreenState();
}

class _GenderScreenState extends State<GenderScreen> {
  String? _selected; // 'male' or 'female'

  void _onSelect(String value) {
    setState(() => _selected = value);
  }

  @override
  void initState() {
    super.initState();
    _loadSavedGender();
  }

  Future<void> _loadSavedGender() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('gender');
    if (saved != null && mounted) {
      setState(() => _selected = saved);
    }
  }

  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)?.settings.arguments;
    final bool onboarding = args is Map<String, dynamic> && (args['onboarding'] == true);
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: const Color(0xFFFEF8F4),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
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
                    AppTranslations.get('select_gender'),
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.black,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Gender choices
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Row(
                children: [
                  Expanded(
                    child: _ChoiceChip(
                      label: AppTranslations.get('male'),
                      selected: _selected == 'male',
                      onTap: () => _onSelect('male'),
                      outlined: true,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _ChoiceChip(
                      label: AppTranslations.get('female'),
                      selected: _selected == 'female',
                      onTap: () => _onSelect('female'),
                      outlined: true,
                    ),
                  ),
                ],
              ),
            ),

            const Spacer(),

            // Next button
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
                      : () async {
                          final prefs = await SharedPreferences.getInstance();
                          await prefs.setString('gender', _selected!);
                          // Persist to Admin API
                          try {
                            final uj = prefs.getString('user');
                            String? userId;
                            if (uj != null && uj.isNotEmpty) {
                              final obj = jsonDecode(uj);
                              if (obj is Map<String, dynamic>) {
                                final inner = (obj['user'] is Map<String, dynamic>) ? obj['user'] as Map<String, dynamic> : obj;
                                userId = (inner['id'] ?? inner['_id'] ?? '').toString();
                              }
                            }
                            if (userId != null && userId.isNotEmpty) {
                              final res = await http.put(
                                Uri.parse('https://admin.yaari.me/api/users/$userId'),
                                headers: {'Content-Type': 'application/json'},
                                body: jsonEncode({'gender': _selected}),
                              );
                              if (res.statusCode >= 200 && res.statusCode < 300) {
                                // Merge into local user JSON for future starts
                                if (uj != null) {
                                  try {
                                    final obj = jsonDecode(uj);
                                    if (obj is Map<String, dynamic>) {
                                      if (obj['user'] is Map<String, dynamic>) {
                                        (obj['user'] as Map<String, dynamic>)['gender'] = _selected;
                                      } else {
                                        obj['gender'] = _selected;
                                      }
                                      await prefs.setString('user', jsonEncode(obj));
                                    }
                                  } catch (_) {}
                                }
                              }
                            }
                          } catch (_) {}
                          // Update ProfileStore gender for in-app use
                          final current = ProfileStore.instance.notifier.value;
                          ProfileStore.instance.update(current.copyWith(gender: _selected!));
                          if (!mounted) return;
                          if (onboarding) {
                            Navigator.pushNamed(
                              context,
                              '/edit_profile',
                              arguments: {'mode': 'add', 'onboarding': true},
                            );
                          } else {
                            Navigator.pushNamed(context, '/home');
                          }
                        },
                  child: Text(
                    AppTranslations.get('next'),
                    style: const TextStyle(
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

class _ChoiceChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final bool outlined;
  const _ChoiceChip({
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