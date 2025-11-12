import 'package:flutter/foundation.dart';
import 'package:firebase_analytics/firebase_analytics.dart';

class FirebaseAnalyticsService {
  FirebaseAnalyticsService._();
  static final FirebaseAnalyticsService instance = FirebaseAnalyticsService._();

  FirebaseAnalytics? _analytics;
  FirebaseAnalyticsObserver? _observer;

  FirebaseAnalyticsObserver? get observer => _observer;

  Future<void> init() async {
    try {
      _analytics = FirebaseAnalytics.instance;
      await _analytics?.setAnalyticsCollectionEnabled(true);
      _observer = FirebaseAnalyticsObserver(analytics: _analytics!);
      
      // Log app_open event
      await _analytics?.logAppOpen();
      
      debugPrint('📊 [Firebase Analytics] Initialized successfully');
    } catch (e) {
      debugPrint('⚠️ [Firebase Analytics] Init error: $e');
    }
  }

  // Event 1: registrationDone
  void trackRegistrationDone({
    required String userId,
    required String method,
    String? referralCode,
  }) {
    try {
      _analytics?.logEvent(
        name: 'registrationDone',
        parameters: {
          'userId': userId,
          'method': method,
          if (referralCode != null) 'referralCode': referralCode,
        },
      );
      debugPrint('📊 [Firebase Analytics] registrationDone: userId=$userId, method=$method');
    } catch (e) {
      debugPrint('⚠️ [Firebase Analytics] trackRegistrationDone error: $e');
    }
  }

  // Event 2: videoCallCtaClicked
  void trackVideoCallCtaClicked({
    required String creatorId,
    required int ratePerMin,
    required int walletBalance,
  }) {
    try {
      _analytics?.logEvent(
        name: 'videoCallCtaClicked',
        parameters: {
          'creatorId': creatorId,
          'ratePerMin': ratePerMin,
          'walletBalance': walletBalance,
        },
      );
      debugPrint('📊 [Firebase Analytics] videoCallCtaClicked: creatorId=$creatorId');
    } catch (e) {
      debugPrint('⚠️ [Firebase Analytics] trackVideoCallCtaClicked error: $e');
    }
  }

  // Event 3: audioCallCtaClicked
  void trackAudioCallCtaClicked({
    required String creatorId,
    required int ratePerMin,
    required int walletBalance,
  }) {
    try {
      _analytics?.logEvent(
        name: 'audioCallCtaClicked',
        parameters: {
          'creatorId': creatorId,
          'ratePerMin': ratePerMin,
          'walletBalance': walletBalance,
        },
      );
      debugPrint('📊 [Firebase Analytics] audioCallCtaClicked: creatorId=$creatorId');
    } catch (e) {
      debugPrint('⚠️ [Firebase Analytics] trackAudioCallCtaClicked error: $e');
    }
  }

  // Event 4: paymentDone
  void trackPaymentDone({
    required String packId,
    required num packValue,
    required String transactionId,
    required String paymentGateway,
    required String status,
  }) {
    try {
      _analytics?.logEvent(
        name: 'paymentDone',
        parameters: {
          'packId': packId,
          'packValue': packValue,
          'transactionId': transactionId,
          'paymentGateway': paymentGateway,
          'status': status,
        },
      );
      debugPrint('📊 [Firebase Analytics] paymentDone: transactionId=$transactionId, status=$status');
    } catch (e) {
      debugPrint('⚠️ [Firebase Analytics] trackPaymentDone error: $e');
    }
  }
}
