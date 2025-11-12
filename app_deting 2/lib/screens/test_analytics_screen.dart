import 'package:flutter/material.dart';
import '../services/firebase_analytics_service.dart';
import '../services/meta_analytics_service.dart';

class TestAnalyticsScreen extends StatelessWidget {
  const TestAnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Test Firebase Analytics'),
        backgroundColor: const Color(0xFFFF8547),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Test Firebase & Meta Analytics Events',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                FirebaseAnalyticsService.instance.trackRegistrationDone(
                  userId: 'test_user_123',
                  method: 'phone',
                  referralCode: 'TEST123',
                );
                MetaAnalyticsService.instance.trackRegistrationDone(
                  userId: 'test_user_123',
                  method: 'phone',
                  referralCode: 'TEST123',
                );
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('registrationDone event sent to Firebase & Meta')),
                );
              },
              child: const Text('Test registrationDone'),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: () {
                FirebaseAnalyticsService.instance.trackVideoCallCtaClicked(
                  creatorId: 'creator_456',
                  ratePerMin: 10,
                  walletBalance: 100,
                );
                MetaAnalyticsService.instance.trackVideoCallCtaClicked(
                  creatorId: 'creator_456',
                  ratePerMin: 10,
                  walletBalance: 100,
                );
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('videoCallCtaClicked event sent to Firebase & Meta')),
                );
              },
              child: const Text('Test videoCallCtaClicked'),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: () {
                FirebaseAnalyticsService.instance.trackAudioCallCtaClicked(
                  creatorId: 'creator_789',
                  ratePerMin: 5,
                  walletBalance: 100,
                );
                MetaAnalyticsService.instance.trackAudioCallCtaClicked(
                  creatorId: 'creator_789',
                  ratePerMin: 5,
                  walletBalance: 100,
                );
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('audioCallCtaClicked event sent to Firebase & Meta')),
                );
              },
              child: const Text('Test audioCallCtaClicked'),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: () {
                FirebaseAnalyticsService.instance.trackPaymentDone(
                  packId: 'pack_100',
                  packValue: 99.99,
                  transactionId: 'txn_test_123',
                  paymentGateway: 'razorpay',
                  status: 'success',
                );
                MetaAnalyticsService.instance.trackPaymentDone(
                  packId: 'pack_100',
                  packValue: 99.99,
                  transactionId: 'txn_test_123',
                  paymentGateway: 'razorpay',
                  status: 'success',
                );
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('paymentDone event sent to Firebase & Meta')),
                );
              },
              child: const Text('Test paymentDone'),
            ),
            const SizedBox(height: 30),
            const Text(
              'Instructions:',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            const Text(
              '1. Enable debug mode for Firebase (see FIREBASE_ANALYTICS_DEBUG.md)\n'
              '2. Click the buttons above\n'
              '3. Firebase: Go to Firebase Console > Analytics > DebugView\n'
              '4. Meta: Go to Meta Events Manager to see events',
              style: TextStyle(fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}
