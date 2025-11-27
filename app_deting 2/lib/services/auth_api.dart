import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class AuthApi {
  static const String _base = 'https://admin.yaari.me/api/auth';
  static const String _tcTokenUrl = 'https://oauth.truecaller.com/v1/token';
  static const String _tcUserinfoUrl = 'https://oauth.truecaller.com/v1/userinfo';

  static Future<Map<String, dynamic>> sendOtp(String phone) async {
    final uri = Uri.parse('$_base/send-otp');
    final res = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone}),
    );
    final body = _decodeBody(res);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return {'success': true, 'data': body};
    }
    return {
      'success': false,
      'message': body['message'] ?? 'Failed to send OTP',
      'status': res.statusCode,
    };
  }

  static Future<Map<String, dynamic>> verifyOtp({required String phone, required String otp}) async {
    final uri = Uri.parse('$_base/verify-otp');
    final res = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone, 'otp': otp}),
    );
    final body = _decodeBody(res);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return {'success': true, 'data': body};
    }
    return {
      'success': false,
      'message': body['message'] ?? 'Invalid OTP',
      'status': res.statusCode,
    };
  }

  static Map<String, dynamic> _decodeBody(http.Response res) {
    try {
      return jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      return {'raw': res.body};
    }
  }

  static String _getErrorMessage(int statusCode, Map<String, dynamic> body) {
    if (statusCode == 503) {
      return 'Truecaller service unavailable. Please check your internet connection and try again.';
    }
    
    final message = body['message']?.toString();
    if (message != null && message.isNotEmpty) {
      return message;
    }
    
    return 'Truecaller login failed';
  }

  static Future<Map<String, dynamic>> truecallerExchange({required String authorizationCode, required String codeVerifier}) async {
    final uri = Uri.parse('$_base/truecaller-oauth/exchange');
    final res = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'authorizationCode': authorizationCode,
        'codeVerifier': codeVerifier,
      }),
    );
    final body = _decodeBody(res);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return {'success': true, 'data': body};
    }
    return {
      'success': false,
      'message': body['message'] ?? 'Truecaller exchange failed',
      'status': res.statusCode,
    };
  }

  static Future<Map<String, dynamic>> truecallerLogin({required String authorizationCode, required String codeVerifier}) async {
    // Use server-side exchange endpoint instead of direct Truecaller API calls
    // Truecaller OAuth endpoints are not directly accessible and should go through your server
    try {
      debugPrint('tc:using server-side exchange endpoint');
      
      final exchangeRes = await http.post(
        Uri.parse('$_base/truecaller-oauth/login'),
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': 'fn_yohgvr75otxdy6eqursnetjuhk8b8xqdqzvahurs',
        },
        body: jsonEncode({
          'authorizationCode': authorizationCode,
          'codeVerifier': codeVerifier,
        }),
      ).timeout(const Duration(seconds: 15));
      
      debugPrint('tc:server exchange response status=${exchangeRes.statusCode}');
      final exchangeJson = _decodeBody(exchangeRes);
      
      if (exchangeRes.statusCode >= 200 && exchangeRes.statusCode < 300) {
        debugPrint('tc:server exchange success');
        return {'success': true, 'data': exchangeJson};
      }
      
      debugPrint('tc:server exchange failed');
      return {
        'success': false,
        'message': exchangeJson['message'] ?? 'Truecaller login failed',
        'status': exchangeRes.statusCode,
      };
      
    } catch (e) {
      debugPrint('tc:exchange error: $e');
      return {
        'success': false,
        'message': 'Cannot connect to authentication service',
        'status': 503,
      };
    }
  }
}
