import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:pinput/pinput.dart';
import 'package:shared_preferences/shared_preferences.dart';
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
  bool _isChecked = false;
  bool _isVerifying = false;
  bool _isResending = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _otpFocusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _otpController.dispose();
    _otpFocusNode.dispose();
    super.dispose();
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
                      onPressed: _isResending ? null : () => _handleResend(phone),
                      child: _isResending
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2.5),
                            )
                          : const Text('Resend OTP'),
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
        // Store user profile JSON (if present)
        final data = result['data'] ?? {};
        await prefs.setString('user', jsonEncode(data));
        if (!mounted) return;
        // First-time gating: if language not set -> language; else if gender not set -> gender; else -> home
        final language = prefs.getString('language');
        final gender = prefs.getString('gender');
        String next = '/home';
        if (language == null || language.isEmpty) {
          next = '/language';
        } else if (gender == null || gender.isEmpty) {
          next = '/gender';
        }
        Navigator.pushNamed(context, next);
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
    }
  }
}