import 'package:firebase_analytics/firebase_analytics.dart';

class FirebaseAnalyticsService {
  static final FirebaseAnalyticsService _instance = FirebaseAnalyticsService._();
  static FirebaseAnalyticsService get instance => _instance;
  FirebaseAnalyticsService._();

  final FirebaseAnalytics _analytics = FirebaseAnalytics.instance;

  Future<void> logPaymentDone({
    required String packId,
    required double packValue,
    required String transactionId,
    required String paymentGateway,
    required String status,
  }) async {
    await _analytics.logEvent(
      name: 'paymentDone',
      parameters: {
        'packId': packId,
        'packValue': packValue,
        'transactionId': transactionId,
        'paymentGateway': paymentGateway,
        'status': status,
      },
    );
  }

  Future<void> logRegistrationDone({
    required String userId,
    required String method,
    String? referralCode,
  }) async {
    await _analytics.logEvent(
      name: 'registrationDone',
      parameters: {
        'userId': userId,
        'method': method,
        if (referralCode != null) 'referralCode': referralCode,
      },
    );
  }

  Future<void> logVideoCallCtaClicked({
    required String creatorId,
    required int ratePerMin,
    required int walletBalance,
  }) async {
    await _analytics.logEvent(
      name: 'videoCallCtaClicked',
      parameters: {
        'creatorId': creatorId,
        'ratePerMin': ratePerMin,
        'walletBalance': walletBalance,
      },
    );
  }

  Future<void> logAudioCallCtaClicked({
    required String creatorId,
    required int ratePerMin,
    required int walletBalance,
  }) async {
    await _analytics.logEvent(
      name: 'audioCallCtaClicked',
      parameters: {
        'creatorId': creatorId,
        'ratePerMin': ratePerMin,
        'walletBalance': walletBalance,
      },
    );
  }
}
