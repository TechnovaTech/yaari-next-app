import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/auth_api.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final TextEditingController _phoneController = TextEditingController();
  final FocusNode _phoneFocusNode = FocusNode();
  static const Color accent = Color(0xFFFF8547);
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    // Auto focus phone input when screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _phoneFocusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _phoneFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: GestureDetector(
        behavior: HitTestBehavior.translucent,
        onTap: () => FocusScope.of(context).unfocus(),
        child: Stack(
          children: [
            // 🔹 Background image full screen
            SizedBox(
              width: size.width,
              height: size.height,
              child: const Image(
                image: AssetImage('assets/images/yari.png'), // your image file
                fit: BoxFit.cover,
              ),
            ),

            // 🔹 White popup bottom card
            Align(
              alignment: Alignment.bottomCenter,
              child: SafeArea(
                minimum: const EdgeInsets.only(bottom: 12),
                child: Container(
                  width: double.infinity,
                  margin: const EdgeInsets.symmetric(horizontal: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 26),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: const [
                      BoxShadow(color: Colors.black12, blurRadius: 24, offset: Offset(0, -6)),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                    const Text(
                      'Yaari',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                        color: accent,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Connect with real people',
                      style: TextStyle(fontSize: 14, color: Colors.grey),
                    ),
                    const SizedBox(height: 25),

                    // 🔹 Phone input (prefilled +91 prefix)
                    TextField(
                      controller: _phoneController,
                      focusNode: _phoneFocusNode,
                      keyboardType: TextInputType.phone,
                      maxLength: 10,
                      buildCounter: (_, {required int currentLength, required bool isFocused, required int? maxLength}) => const SizedBox.shrink(),
                      style: const TextStyle(fontSize: 16, color: Colors.black),
                      decoration: InputDecoration(
                        hintText: 'Enter your Phone Number',
                        filled: true,
                        fillColor: const Color(0xFFFDFDFD),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 15, vertical: 12),
                        prefixText: '+91 ',
                        prefixStyle: const TextStyle(color: Colors.black, fontSize: 16, fontWeight: FontWeight.w600),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: const BorderSide(color: Color(0xFFDEDEDE)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: const BorderSide(color: Color(0xFFBFBFBF)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // 🔹 Get OTP button
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: accent,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(28),
                          ),
                        ),
                        onPressed: _isSending ? null : _sendOtpFixed,
                        child: _isSending
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                              )
                            : const Text(
                                'Get OTP',
                                style: TextStyle(fontSize: 16, color: Colors.white),
                              ),
                      ),
                    ),

                    const SizedBox(height: 15),

                    // 🔹 Terms & Conditions
                    GestureDetector(
                      onTap: () => Navigator.pushNamed(context, '/privacy_policy'),
                      child: const Text(
                        'Terms & Condition',
                        style: TextStyle(
                          decoration: TextDecoration.underline,
                          color: accent,
                          fontSize: 14,
                        ),
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

  Future<void> _handleSendOtp() async {
    final raw = _phoneController.text.trim();
    final isValid = RegExp(r'^\d{10}$').hasMatch(raw);
    if (!isValid) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 10-digit phone number')),
      );
      return;
    }

    final phone = '+91$raw';

    setState(() => _isSending = true);
    try {
      final result = await AuthApi.sendOtp(phone);
      if (result['success'] == true) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('phone', phone);
        if (!mounted) return;
        Navigator.pushNamed(context, '/otp', arguments: phone);
      } else {
        final msg = (result['message'] ?? 'Failed to send OTP').toString();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }
  Future<void> _sendOtpFixed() async {
    final raw = _phoneController.text.trim();
    final isValid = RegExp(r'^\d{10}$').hasMatch(raw);
    if (!isValid) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 10-digit phone number')),
      );
      return;
    }

    final phone = '+91$raw';

    setState(() => _isSending = true);
    try {
      final result = await AuthApi.sendOtp(phone);
      if (result['success'] == true) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('phone', phone);
        if (!mounted) return;
        Navigator.pushNamed(context, '/otp', arguments: phone);
      } else {
        final msg = (result['message'] ?? 'Failed to send OTP').toString();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }
}
