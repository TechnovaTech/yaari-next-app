import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/login_screen.dart';
import 'screens/otp_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/coins_screen.dart';
import 'screens/call_history_screen.dart';
import 'screens/transaction_history_screen.dart';
import 'screens/customer_support_screen.dart';
import 'screens/privacy_policy_screen.dart';
import 'screens/language_screen.dart';
import 'screens/gender_screen.dart';
import 'screens/home_screen.dart';
import 'screens/user_detail_screen.dart';
import 'screens/edit_profile_screen.dart';
import 'screens/video_call_screen.dart';
import 'screens/audio_call_screen.dart';
import 'screens/privacy_policy_details_screen.dart';
import 'services/incoming_call_service.dart';
import 'services/socket_service.dart';
import 'services/analytics_service.dart';
import 'utils/translations.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  static final GlobalKey<NavigatorState> appNavigatorKey = GlobalKey<NavigatorState>();
  static final ValueNotifier<String> languageNotifier = ValueNotifier<String>('en');

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
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
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Yaari',
      theme: ThemeData(fontFamily: 'Poppins'),
      navigatorKey: MyApp.appNavigatorKey,
      home: const AppStart(),
      routes: {
        '/login': (context) => const LoginPage(),
        '/otp': (context) => const OtpScreen(),
        '/language': (context) => const LanguageScreen(),
        '/gender': (context) => const GenderScreen(),
        '/home': (context) => const HomeScreen(),
        '/profile': (context) => const ProfileScreen(),
        '/user_detail': (context) => const UserDetailScreen(),
        '/edit_profile': (context) => const EditProfileScreen(),
        '/coins': (context) => const CoinsScreen(),
        '/call_history': (context) => const CallHistoryScreen(),
        '/transaction_history': (context) => const TransactionHistoryScreen(),
        '/customer_support': (context) => const CustomerSupportScreen(),
        '/privacy_policy': (context) => const PrivacyPolicyScreen(),
        '/privacy_policy_details': (context) => const PrivacyPolicyDetailsScreen(),
        '/video_call': (context) => const VideoCallScreen(),
        '/audio_call': (context) => const AudioCallScreen(),
      },
    );
  }
}

class AppStart extends StatefulWidget {
  const AppStart({super.key});

  @override
  State<AppStart> createState() => _AppStartState();
}

class _AppStartState extends State<AppStart> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _route());
  }

  Future<void> _route() async {
    try {
      // Initialize translations
      await AppTranslations.init();
      
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString('user');

      if (!mounted) return;

      if (userJson != null && userJson.isNotEmpty) {
        debugPrint('🔄 [AppStart] User logged in, initializing services...');

        // Initialize analytics
        await AnalyticsService.instance.init();
        AnalyticsService.instance.track('App Open', {'Platform': 'flutter'});

        // Skip socket and incoming call services on web
        if (!kIsWeb) {
          // Extract user ID for socket connection
          String? userId;
          try {
            final userData = jsonDecode(userJson);
            if (userData is Map<String, dynamic>) {
              final root = userData;
              Map<String, dynamic> inner = root;
              final u = root['user'];
              if (u is Map<String, dynamic>) {
                inner = u;
              } else {
                final d = root['data'];
                if (d is Map<String, dynamic>) {
                  inner = d;
                }
              }
              for (final k in const ['id', '_id', 'userId']) {
                final v = inner[k];
                if (v != null && v.toString().isNotEmpty) {
                  userId = v.toString();
                  break;
                }
              }
            }
          } catch (e) {
            debugPrint('⚠️ [AppStart] Error parsing user data: $e');
          }

          // Connect socket first
          if (userId != null && userId.isNotEmpty) {
            debugPrint('🔌 [AppStart] Connecting socket for user: $userId');
            SocketService.instance.connect(userId);
            // Wait for socket to connect
            await Future.delayed(const Duration(milliseconds: 800));
            // Try to enrich profile from stored userJson
            Map<String, dynamic> profile = {};
            try {
              final data = jsonDecode(userJson);
              final Map<String, dynamic> root =
                  (data is Map<String, dynamic>) ? data : <String, dynamic>{};
              Map<String, dynamic> inner = root;
              final u2 = root['user'];
              if (u2 is Map<String, dynamic>) {
                inner = u2;
              } else {
                final d2 = root['data'];
                if (d2 is Map<String, dynamic>) {
                  inner = d2;
                }
              }
              profile = {
                'Name': (inner['name'] ?? inner['userName'] ?? '')?.toString(),
                'Email': (inner['email'] ?? '')?.toString(),
                'Phone': (inner['phone'] ?? inner['mobile'] ?? '')?.toString(),
                'Gender': (inner['gender'] ?? '')?.toString(),
              }..removeWhere((k, v) => v == null || (v is String && v.isEmpty));
            } catch (_) {}
            await AnalyticsService.instance.identify(userId, profile: profile);
          } else {
            debugPrint('⚠️ [AppStart] No user ID found, skipping socket connection');
          }

          // Start incoming call listener
          debugPrint('🔔 [AppStart] Starting incoming call service...');
          await IncomingCallService.instance.start(
            navigatorKey: MyApp.appNavigatorKey,
          );
        }

        // Navigate to home
        debugPrint('✅ [AppStart] Services initialized, navigating to home');
        if (!mounted) return;
        AnalyticsService.instance.screenView('Home');
        Navigator.pushReplacementNamed(context, '/home');
      } else {
        debugPrint('🔓 [AppStart] No user found, navigating to login');
        AnalyticsService.instance.screenView('Login');
        Navigator.pushReplacementNamed(context, '/login');
      }
    } catch (e) {
      debugPrint('❌ [AppStart] Error during routing: $e');
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}