import 'package:flutter/foundation.dart';
import 'package:facebook_app_events/facebook_app_events.dart';

class MetaAnalyticsService {
  MetaAnalyticsService._();
  static final MetaAnalyticsService instance = MetaAnalyticsService._();

  final _facebookAppEvents = FacebookAppEvents();

  Future<void> init() async {
    try {
      await _facebookAppEvents.setAdvertiserTracking(enabled: true);
      debugPrint('📊 [Meta Analytics] Initialized');
    } catch (e) {
      debugPrint('⚠️ [Meta Analytics] Init error: $e');
    }
  }

  void trackRegistrationDone({
    required String userId,
    required String method,
    String? referralCode,
  }) {
    try {
      _facebookAppEvents.logEvent(
        name: 'registrationDone',
        parameters: {
          'userId': userId,
          'method': method,
          if (referralCode != null) 'referralCode': referralCode,
        },
      );
      debugPrint('📊 [Meta Analytics] registrationDone: userId=$userId');
    } catch (e) {
      debugPrint('⚠️ [Meta Analytics] trackRegistrationDone error: $e');
    }
  }

  void trackVideoCallCtaClicked({
    required String creatorId,
    required int ratePerMin,
    required int walletBalance,
  }) {
    try {
      _facebookAppEvents.logEvent(
        name: 'videoCallCtaClicked',
        parameters: {
          'creatorId': creatorId,
          'ratePerMin': ratePerMin,
          'walletBalance': walletBalance,
        },
      );
      debugPrint('📊 [Meta Analytics] videoCallCtaClicked: creatorId=$creatorId');
    } catch (e) {
      debugPrint('⚠️ [Meta Analytics] trackVideoCallCtaClicked error: $e');
    }
  }

  void trackAudioCallCtaClicked({
    required String creatorId,
    required int ratePerMin,
    required int walletBalance,
  }) {
    try {
      _facebookAppEvents.logEvent(
        name: 'audioCallCtaClicked',
        parameters: {
          'creatorId': creatorId,
          'ratePerMin': ratePerMin,
          'walletBalance': walletBalance,
        },
      );
      debugPrint('📊 [Meta Analytics] audioCallCtaClicked: creatorId=$creatorId');
    } catch (e) {
      debugPrint('⚠️ [Meta Analytics] trackAudioCallCtaClicked error: $e');
    }
  }

  void trackPaymentDone({
    required String packId,
    required num packValue,
    required String transactionId,
    required String paymentGateway,
    required String status,
  }) {
    try {
      _facebookAppEvents.logEvent(
        name: 'paymentDone',
        parameters: {
          'packId': packId,
          'packValue': packValue,
          'transactionId': transactionId,
          'paymentGateway': paymentGateway,
          'status': status,
        },
      );
      debugPrint('📊 [Meta Analytics] paymentDone: transactionId=$transactionId');
    } catch (e) {
      debugPrint('⚠️ [Meta Analytics] trackPaymentDone error: $e');
    }
  }
}
