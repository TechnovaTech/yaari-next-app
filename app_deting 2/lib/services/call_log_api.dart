import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class CallLogApi {
  // Always use public base which has permissive CORS
  static const String _base = 'https://admin.yaari.me';

  static Uri _url(String path) => Uri.parse('$_base$path');

  static Future<bool> logStart({
    required String callerId,
    required String receiverId,
    required String callType, // 'audio' | 'video'
    required String channelName,
  }) async {
    try {
      final payload = {
        'callerId': callerId,
        'receiverId': receiverId,
        'callType': callType,
        'action': 'start',
        'channelName': channelName,
      };
      debugPrint('📤 [CallLogApi] Logging call start: ' + jsonEncode(payload));
      final res = await http.post(
        _url('/api/call-log'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );
      debugPrint('✅ [CallLogApi] Start response ${res.statusCode}: ${res.body}');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final body = jsonDecode(res.body);
        if (body is Map && (body['verified'] == true || body['success'] == true)) {
          return true;
        }
        return true; // consider ok for history even if not explicitly verified
      }
    } catch (e) {
      debugPrint('❌ [CallLogApi] Failed to log start: $e');
    }
    return false;
  }

  static Future<bool> logEnd({
    required String callerId,
    required String receiverId,
    required String callType, // 'audio' | 'video'
    required int durationSeconds,
    String status = 'completed',
    int cost = 0,
  }) async {
    try {
      final payload = {
        'callerId': callerId,
        'receiverId': receiverId,
        'callType': callType,
        'action': 'end',
        'duration': durationSeconds,
        'cost': cost,
        'status': status,
      };
      debugPrint('📤 [CallLogApi] Logging call end: ' + jsonEncode(payload));
      final res = await http.post(
        _url('/api/call-log'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );
      debugPrint('✅ [CallLogApi] End response ${res.statusCode}: ${res.body}');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final body = jsonDecode(res.body);
        if (body is Map && (body['verified'] == true || body['success'] == true)) {
          return true;
        }
        return true;
      }
    } catch (e) {
      debugPrint('❌ [CallLogApi] Failed to log end: $e');
    }
    return false;
  }
}