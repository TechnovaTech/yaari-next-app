import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:mixpanel_flutter/mixpanel_flutter.dart';
import '../config/analytics.dart';

class AnalyticsService {
  AnalyticsService._();
  static final AnalyticsService instance = AnalyticsService._();

  Mixpanel? _mixpanel;
  String? _identity;

  Future<void> init() async {
    try {
      // Initialize Mixpanel
      if (_mixpanel == null) {
        _mixpanel = await Mixpanel.init(
          AnalyticsConfig.mixpanelToken,
          optOutTrackingDefault: false,
          trackAutomaticEvents: false,
        );
        debugPrint('📊 [Analytics] Mixpanel initialized');
      }
    } catch (e) {
      debugPrint('⚠️ [Analytics] Mixpanel init error: $e');
    }


  }

  Future<void> identify(String identity, {Map<String, dynamic>? profile}) async {
    _identity = identity;
    try {
      _mixpanel?.identify(identity);
      if (profile != null && profile.isNotEmpty) {
        profile.forEach((k, v) {
          try { _mixpanel?.getPeople().set(k, v); } catch (_) {}
        });
      }
    } catch (e) {
      debugPrint('⚠️ [Analytics] Mixpanel identify error: $e');
    }

  }

  void track(String event, [Map<String, dynamic>? props]) {
    final platform = kIsWeb ? 'web' : 'mobile';
    final enriched = {
      'timestamp': DateTime.now().toIso8601String(),
      'platform': platform,
      ...(props ?? {}),
    };
    try {
      _mixpanel?.track(event, properties: enriched);
    } catch (e) {
      debugPrint('⚠️ [Analytics] Mixpanel track error: $e');
    }

  }

  void screenView(String screenName, [Map<String, dynamic>? props]) {
    final payload = {'Screen': screenName, ...(props ?? {})};
    track('Screen View', payload);
  }

  void trackCallEvent({
    required String action, // initiated, accepted, ended, busy, declined, cancel
    required String callType, // audio|video
    String? callerId,
    String? receiverId,
    String? channelName,
    int? durationSeconds,
    Map<String, dynamic>? extra,
  }) {
    String eventName;
    if (action == 'initiated') {
      eventName = 'Call Initiated';
    } else if (action == 'accepted') {
      eventName = 'Call Accepted';
    } else if (action == 'ended') {
      eventName = 'Call Ended';
    } else if (action == 'busy') {
      eventName = 'Call Busy';
    } else if (action == 'declined') {
      eventName = 'Call Declined';
    } else if (action == 'cancel') {
      eventName = 'Call Cancelled';
    } else {
      eventName = 'Call Event';
    }
    final props = {
      'Type': callType,
      if (callerId != null) 'CallerId': callerId,
      if (receiverId != null) 'ReceiverId': receiverId,
      if (channelName != null) 'Channel': channelName,
      if (durationSeconds != null) 'DurationSec': durationSeconds,
      ...(extra ?? {}),
    };
    track(eventName, props);
  }
}