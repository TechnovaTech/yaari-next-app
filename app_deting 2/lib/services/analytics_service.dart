import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:mixpanel_flutter/mixpanel_flutter.dart';
import 'package:clevertap_plugin/clevertap_plugin.dart';
import '../config/analytics.dart';

class AnalyticsService {
  AnalyticsService._();
  static final AnalyticsService instance = AnalyticsService._();

  Mixpanel? _mixpanel;
  bool _cleverTapInitialized = false;
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

    try {
      // CleverTap plugin initializes via native configuration; mark available on mobile
      if (!_cleverTapInitialized && (Platform.isAndroid || Platform.isIOS)) {
        _cleverTapInitialized = true;
        try { CleverTapPlugin.setDebugLevel(3); } catch (_) {}
        debugPrint('📈 [Analytics] CleverTap available');
      }
    } catch (e) {
      debugPrint('⚠️ [Analytics] CleverTap availability error: $e');
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
    try {
      if (_cleverTapInitialized) {
        final base = {
          'Identity': identity,
          'MSG-push': true,
          'MSG-email': true,
          'MSG-sms': true,
        };
        final p = {...base, ...(profile ?? {})};
        await CleverTapPlugin.onUserLogin(p);
      }
    } catch (e) {
      debugPrint('⚠️ [Analytics] CleverTap onUserLogin error: $e');
    }
  }

  void track(String event, [Map<String, dynamic>? props]) {
    final platform = kIsWeb
        ? 'web'
        : (Platform.isAndroid || Platform.isIOS)
            ? 'mobile'
            : 'other';
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
    try {
      if (_cleverTapInitialized) {
        CleverTapPlugin.recordEvent(event, enriched);
      }
    } catch (e) {
      debugPrint('⚠️ [Analytics] CleverTap recordEvent error: $e');
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