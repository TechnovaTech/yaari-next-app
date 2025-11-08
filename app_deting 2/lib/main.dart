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



void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Yaari',
      theme: ThemeData(fontFamily: 'Poppins'),
      home: const AppStart(),
      routes: {
        '/login': (context) => const LoginPage(),
        '/otp': (context) => const OtpScreen(),
        // removed: '/verified': (context) => const VerifiedScreen(),
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

// Decides where to start based on persisted login state.
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
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString('user');
      if (!mounted) return;
      if (userJson != null && userJson.isNotEmpty) {
        Navigator.pushReplacementNamed(context, '/home');
      } else {
        Navigator.pushReplacementNamed(context, '/login');
      }
    } catch (_) {
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