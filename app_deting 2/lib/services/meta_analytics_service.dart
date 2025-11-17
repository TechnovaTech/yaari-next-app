import 'package:flutter/foundation.dart';
import 'package:facebook_app_events/facebook_app_events.dart';

class MetaAnalyticsService {
  MetaAnalyticsService._();
  static final MetaAnalyticsService instance = MetaAnalyticsService._();

  FacebookAppEvents? _facebookAppEvents;
  bool _isInitialized = false;
  static const int _maxAttempts = 10;
  bool _androidWarmupDone = false;
  Future<void>? _warmupFuture;
  final List<Map<String, dynamic>> _queue = [];
  bool _flushing = false;

  Future<void> init() async {
    try {
      _facebookAppEvents ??= FacebookAppEvents();
      _isInitialized = true;
      try {
        await _facebookAppEvents?.setAdvertiserTracking(enabled: true);
      } catch (_) {}
      debugPrint('📊 [Meta Analytics] Initialized');
    } catch (e) {
      _isInitialized = false;
      debugPrint('⚠️ [Meta Analytics] Init error: $e');
    }
  }

  Future<void> _logEvent(String name, Map<String, dynamic> parameters, {int attempt = 1}) async {
    _facebookAppEvents ??= FacebookAppEvents();
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android && !_androidWarmupDone) {
      _warmupFuture ??= Future.delayed(const Duration(seconds: 2)).then((_) {
        _androidWarmupDone = true;
      });
      await _warmupFuture;
    }
    try {
      try {
        await _facebookAppEvents?.setAdvertiserTracking(enabled: true);
      } catch (_) {}
      await _facebookAppEvents?.logEvent(name: name, parameters: parameters);
      debugPrint('✅ [Meta Analytics] Event logged: $name with params: $parameters');
    } catch (e) {
      debugPrint('❌ [Meta Analytics] Error logging $name: $e');
      final msg = e.toString();
      final needsRetry = msg.contains('appEventsLogger has not been initialized') || msg.contains('UninitializedPropertyAccessException');
      if (needsRetry && attempt < _maxAttempts) {
        debugPrint('🔄 [Meta Analytics] Retrying $name (attempt $attempt/$_maxAttempts)');
        await Future.delayed(Duration(milliseconds: 300 + (attempt * 200)));
        await _logEvent(name, parameters, attempt: attempt + 1);
        return;
      }
      rethrow;
    }
  }

  void _enqueue(String name, Map<String, dynamic> parameters) {
    _queue.add({'name': name, 'parameters': parameters});
    _flush();
  }

  Future<void> _flush() async {
    if (_flushing) return;
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android && !_androidWarmupDone) return;
    _flushing = true;
    try {
      while (_queue.isNotEmpty) {
        final item = _queue.removeAt(0);
        await _logEvent(item['name'] as String, (item['parameters'] as Map<String, dynamic>));
      }
    } finally {
      _flushing = false;
    }
  }

  void markReady() {
    _androidWarmupDone = true;
    _flush();
  }

  void trackRegistrationDone({
    required String userId,
    required String method,
    String? referralCode,
  }) {
    _enqueue('fb_mobile_complete_registration', {
      'fb_registration_method': method,
      if (referralCode != null) 'referralCode': referralCode,
    });
  }

  void trackVideoCallCtaClicked({
    required String creatorId,
    required int ratePerMin,
    required int walletBalance,
  }) {
    _enqueue('fb_mobile_initiated_checkout', {
      'fb_content_type': 'video_call',
      'fb_content_id': creatorId,
      'fb_currency': 'INR',
      'fb_num_items': 1,
    });
  }

  void trackAudioCallCtaClicked({
    required String creatorId,
    required int ratePerMin,
    required int walletBalance,
  }) {
    _enqueue('fb_mobile_initiated_checkout', {
      'fb_content_type': 'audio_call',
      'fb_content_id': creatorId,
      'fb_currency': 'INR',
      'fb_num_items': 1,
    });
  }

  void trackPaymentDone({
    required String packId,
    required num packValue,
    required String transactionId,
    required String paymentGateway,
    required String status,
  }) {
    _enqueue('fb_mobile_purchase', {
      'fb_content_id': packId,
      'fb_content_type': 'product',
      'fb_currency': 'INR',
      'fb_value': packValue,
      'fb_transaction_id': transactionId,
    });
  }
}
