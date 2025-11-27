import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/services.dart';
import 'package:truecaller_sdk/truecaller_sdk.dart';
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
  bool _checkingTruecaller = false;
  StreamSubscription? _tcSub;
  String? _codeVerifier;
  bool _tcFilled = false;
  bool _scopeDowngraded = false;
  bool _exchangeRetried = false;

  @override
  void initState() {
    super.initState();
    // Auto focus phone input when screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _phoneFocusNode.requestFocus();
    });
    _tcSub = TcSdk.streamCallbackData.listen((tc) async {
      if (!mounted) return;
      debugPrint('tc:callback result=${tc.result}');
      switch (tc.result) {
        case TcSdkCallbackResult.success:
          setState(() => _checkingTruecaller = false);
          debugPrint('tc:success, exchanging auth code');
          try {
            final authCode = tc.tcOAuthData?.authorizationCode;
            if (authCode == null || _codeVerifier == null) {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Truecaller data missing')));
              break;
            }
            final res = await AuthApi.truecallerLogin(authorizationCode: authCode, codeVerifier: _codeVerifier!);
            if (res['success'] == true) {
              final payload = res['data'] ?? res['user'];
              if (payload is Map<String, dynamic>) {
                final prefs = await SharedPreferences.getInstance();
                await prefs.setString('user', jsonEncode(payload));
                if (!mounted) break;
                Map<String, dynamic> root = payload;
                final String id = (root['id'] ?? root['_id'] ?? '').toString();
                bool isNew = false;
                if (id.isNotEmpty) {
                  try {
                    final resUser = await http.get(Uri.parse('https://admin.yaari.me/api/users/$id'));
                    if (resUser.statusCode == 200) {
                      final full = jsonDecode(resUser.body);
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
                final msg = 'Truecaller login succeeded but data invalid';
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
              }
            } else {
              final status = res['status'] ?? 0;
              final msg = (res['message'] ?? 'Truecaller login failed').toString();
              if (!_exchangeRetried && status == 403) {
                _exchangeRetried = true;
                debugPrint('tc:403 invalid code; retrying auth code request');
                try {
                  TcSdk.getAuthorizationCode;
                  return;
                } catch (_) {}
              }
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$msg ($status)')));
            }
          } catch (e) {
            debugPrint('tc:login error: $e');
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Truecaller unavailable')));
          }
          break;
        case TcSdkCallbackResult.exception:
        case TcSdkCallbackResult.failure:
          setState(() => _checkingTruecaller = false);
          final code = tc.error?.code ?? tc.exception?.code;
          final msg = tc.error?.message ?? tc.exception?.message ?? 'Unknown error';
          debugPrint('tc:failure/exception code=$code msg=$msg');
          if (!_scopeDowngraded && (msg.contains('Scopes not enabled') || (code == 42203))) {
            try {
              debugPrint('tc:downgrading scopes and retrying without email/offline_access');
              _scopeDowngraded = true;
              TcSdk.setOAuthScopes(['profile', 'phone', 'openid']);
              // Re-request authorization code with reduced scopes
              TcSdk.getAuthorizationCode;
              return;
            } catch (_) {}
          }
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Truecaller unavailable')));
          break;
        default:
          break;
      }
    });
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _phoneFocusNode.dispose();
    try { _tcSub?.cancel(); } catch (_) {}
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isLandscape = MediaQuery.of(context).orientation == Orientation.landscape;

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
                minimum: EdgeInsets.only(bottom: isLandscape ? 4 : 12),
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    maxHeight: size.height * (isLandscape ? 0.75 : 0.62),
                  ),
                  child: Container(
                    width: double.infinity,
                    margin: const EdgeInsets.symmetric(horizontal: 12),
                    padding: EdgeInsets.symmetric(horizontal: 24, vertical: isLandscape ? 18 : 26),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(28),
                      boxShadow: const [
                        BoxShadow(color: Colors.black12, blurRadius: 24, offset: Offset(0, -6)),
                      ],
                    ),
                    child: SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
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
                    SizedBox(height: isLandscape ? 14 : 25),

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
                      readOnly: _tcFilled || _checkingTruecaller,
                    ),
                    SizedBox(height: isLandscape ? 10 : 20),

                    // 🔹 Get OTP button
                    SizedBox(
                      width: double.infinity,
                      height: isLandscape ? 48 : 56,
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

                    SizedBox(height: isLandscape ? 8 : 12),

                    // 🔹 Continue with Truecaller option
                    SizedBox(
                      width: double.infinity,
                      height: isLandscape ? 46 : 52,
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: accent),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                        ),
                        onPressed: _checkingTruecaller ? null : _continueWithTruecaller,
                        child: _checkingTruecaller
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(strokeWidth: 2.0, color: Color(0xFFFF8547)),
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: const [
                                  Icon(Icons.verified_user, color: accent),
                                  SizedBox(width: 8),
                                  Text(
                                    'Continue with Truecaller',
                                    style: TextStyle(fontSize: 15, color: accent, fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ),
                      ),
                    ),

                    SizedBox(height: isLandscape ? 10 : 15),

                    // 🔹 Terms & Conditions
                    GestureDetector(
                      onTap: () async {
                        final Uri termsOfServiceUrl = Uri.parse('https://yaari.me/terms');
                        if (!await launchUrl(termsOfServiceUrl, mode: LaunchMode.inAppWebView)) {
                          throw Exception('Could not launch $termsOfServiceUrl');
                        }
                      },
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
    debugPrint('otp:send start');
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
        debugPrint('otp:send success');
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('phone', phone);
        if (!mounted) return;
        Navigator.pushNamed(context, '/otp', arguments: phone);
      } else {
        final msg = (result['message'] ?? 'Failed to send OTP').toString();
        debugPrint('otp:send fail: $msg');
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      }
    } catch (e) {
      debugPrint('otp:send error: $e');
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  Future<void> _continueWithTruecaller() async {
    setState(() => _checkingTruecaller = true);
    try {
      final usable = await TcSdk.isOAuthFlowUsable
          .timeout(const Duration(seconds: 5), onTimeout: () {
        debugPrint('tc:isOAuthFlowUsable timeout');
        return false;
      });
      debugPrint('tc:isUsable=$usable');
      if (!usable) {
        setState(() => _checkingTruecaller = false);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Truecaller not available')));
        return;
      }
      final state = DateTime.now().microsecondsSinceEpoch.toString();
      debugPrint('tc:setting state=$state');
      TcSdk.setOAuthState(state);
      debugPrint('tc:setting scopes');
      TcSdk.setOAuthScopes(['openid', 'phone', 'profile']);
      debugPrint('tc:generating verifier');
      _codeVerifier = await TcSdk.generateRandomCodeVerifier;
      debugPrint('tc:verifier generated');
      final codeChallenge = await TcSdk.generateCodeChallenge(_codeVerifier!);
      debugPrint('tc:challenge generated');
      if (codeChallenge != null) {
        TcSdk.setCodeChallenge(codeChallenge);
        TcSdk.setLocale('en');
        TcSdk.setTheme(TcSdkOptions.THEME_LIGHT);
        debugPrint('tc:requesting auth code');
        TcSdk.getAuthorizationCode;
        debugPrint('tc:auth code requested, waiting for callback');
        // Set timeout for callback
        Future.delayed(const Duration(seconds: 10), () {
          if (_checkingTruecaller && mounted) {
            debugPrint('tc:callback timeout');
            setState(() => _checkingTruecaller = false);
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Truecaller not responding')));
          }
        });
      } else {
        setState(() => _checkingTruecaller = false);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Device not supported for Truecaller')));
      }
    } on PlatformException catch (e) {
      setState(() => _checkingTruecaller = false);
      debugPrint('tc:platform error: ${e.code} ${e.message}');
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Truecaller not responding')));
    } on TimeoutException catch (e) {
      setState(() => _checkingTruecaller = false);
      debugPrint('tc:timeout: ${e.message}');
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Truecaller not responding')));
    } catch (e) {
      setState(() => _checkingTruecaller = false);
      debugPrint('tc:error: $e');
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Truecaller not responding')));
    }
  }
}
