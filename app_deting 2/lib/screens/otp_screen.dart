import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:pinput/pinput.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import '../services/auth_api.dart';
// removed: import 'verified_screen.dart';

class OtpScreen extends StatefulWidget {
  const OtpScreen({super.key});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final TextEditingController _otpController = TextEditingController();
  final FocusNode _otpFocusNode = FocusNode();
  bool _isChecked = true; // Pre-check 18+ confirmation by default
  bool _isVerifying = false;
  bool _isResending = false;
  int _resendSeconds = 15;
  Timer? _resendTimer;
  bool _canResend = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _otpFocusNode.requestFocus();
    });
    _startResendCooldown(15);
  }

  @override
  void dispose() {
    _otpController.dispose();
    _otpFocusNode.dispose();
    _resendTimer?.cancel();
    super.dispose();
  }

  void _startResendCooldown(int seconds) {
    _resendTimer?.cancel();
    setState(() {
      _resendSeconds = seconds;
      _canResend = false;
    });
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return;
      if (_resendSeconds <= 1) {
        t.cancel();
        setState(() {
          _resendSeconds = 0;
          _canResend = true;
        });
      } else {
        setState(() {
          _resendSeconds -= 1;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final phoneArg = ModalRoute.of(context)?.settings.arguments as String?;
    final phone = phoneArg ?? '';

    final defaultPinTheme = PinTheme(
      width: 45,
      height: 55,
      textStyle: const TextStyle(fontSize: 20),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(12),
        color: Colors.white,
      ),
    );

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: GestureDetector(
        behavior: HitTestBehavior.translucent,
        onTap: () => FocusScope.of(context).unfocus(),
        child: Container(
          width: double.infinity,
          height: double.infinity,
          decoration: const BoxDecoration(
            image: DecorationImage(
              image: AssetImage('assets/images/yari.png'),
              fit: BoxFit.cover,
            ),
          ),
          child: Center(
            child: SingleChildScrollView(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 30, vertical: 40),
                padding: const EdgeInsets.all(25),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(30),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Enter OTP sent to',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.orange,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      phone,
                      style: const TextStyle(
                        fontSize: 16,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Pinput(
                      length: 6,
                      controller: _otpController,
                      focusNode: _otpFocusNode,
                      autofocus: true,
                      defaultPinTheme: defaultPinTheme,
                      onCompleted: (value) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('OTP entered')),
                        );
                      },
                    ),
                    const SizedBox(height: 25),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        minimumSize: const Size(double.infinity, 50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(25),
                        ),
                      ),
                      onPressed: _isVerifying ? null : () => _handleVerify(phone),
                      child: _isVerifying
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                            )
                          : const Text(
                              'Verify & Continue',
                              style: TextStyle(fontSize: 16, color: Colors.white),
                            ),
                    ),
                    const SizedBox(height: 15),
                    TextButton(
                      onPressed: (_isResending || !_canResend) ? null : () => _handleResend(phone),
                      child: _isResending
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2.5),
                            )
                          : Text(_canResend ? 'Resend OTP' : 'Resend in ${_resendSeconds}s'),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Checkbox(
                          value: _isChecked,
                          activeColor: Colors.orange,
                          onChanged: (value) {
                            setState(() {
                              _isChecked = value ?? false;
                            });
                          },
                        ),
                        const Text(
                          'I Confirm I’m 18+',
                          style: TextStyle(color: Colors.black87, fontSize: 14),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _handleVerify(String phoneArg) async {
    final otp = _otpController.text.trim();
    if (!_isChecked) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please confirm you are 18+')),
      );
      return;
    }
    if (!RegExp(r'^\d{6}$').hasMatch(otp)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid 6-digit OTP')),
      );
      return;
    }

    // Prefer argument; fallback to stored phone
    String phone = phoneArg;
    if (phone.isEmpty) {
      final prefs = await SharedPreferences.getInstance();
      phone = prefs.getString('phone') ?? '';
    }
    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Phone number missing. Go back and request OTP again.')),
      );
      return;
    }

    setState(() => _isVerifying = true);
    try {
      final result = await AuthApi.verifyOtp(phone: phone, otp: otp);
      if (result['success'] == true) {
        final prefs = await SharedPreferences.getInstance();
        // Store full response body; downstream screens read `user` from it
        final data = result['data'] ?? {};
        await prefs.setString('user', jsonEncode(data));
        if (!mounted) return;
        // Decide onboarding only for truly new users by checking server `createdAt`
        Map<String, dynamic> root = {};
        if (data is Map<String, dynamic>) root = data;
        final Map<String, dynamic> user = (root['user'] is Map<String, dynamic>)
            ? (root['user'] as Map<String, dynamic>)
            : root;
        final String id = (user['id'] ?? user['_id'] ?? '').toString();
        bool isNew = false;
        if (id.isNotEmpty) {
          try {
            final res = await http.get(Uri.parse('https://admin.yaari.me/api/users/$id'));
            if (res.statusCode == 200) {
              final full = jsonDecode(res.body);
              // Consider new if created very recently and profile fields are empty
              final createdStr = (full['createdAt'] ?? '').toString();
              DateTime? createdAt;
              try { createdAt = DateTime.tryParse(createdStr); } catch (_) {}
              final minutesSinceCreate = createdAt != null ? DateTime.now().difference(createdAt).inMinutes : 9999;
              final hasName = (full['name'] ?? '').toString().trim().isNotEmpty;
              final hasGender = (full['gender'] ?? '').toString().trim().isNotEmpty;
              final hasLanguage = (full['language'] ?? full['lang'] ?? '').toString().trim().isNotEmpty;
              isNew = minutesSinceCreate <= 5 && !(hasName || hasGender || hasLanguage);
            }
          } catch (_) {}
        }
        if (isNew) {
          Navigator.pushNamed(context, '/language', arguments: {'onboarding': true});
        } else {
          Navigator.pushNamed(context, '/home');
        }
      } else {
        final msg = (result['message'] ?? 'Invalid OTP').toString();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isVerifying = false);
    }
  }

  Future<void> _handleResend(String phoneArg) async {
    String phone = phoneArg;
    if (phone.isEmpty) {
      final prefs = await SharedPreferences.getInstance();
      phone = prefs.getString('phone') ?? '';
    }
    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Phone number missing. Go back and request OTP again.')),
      );
      return;
    }
    setState(() => _isResending = true);
    try {
      final result = await AuthApi.sendOtp(phone);
      final ok = result['success'] == true;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ok ? 'OTP resent' : (result['message'] ?? 'Failed to resend OTP').toString())),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isResending = false);
      // Re-arm cooldown regardless of outcome to prevent spamming
      if (mounted) _startResendCooldown(15);
    }
  }
}