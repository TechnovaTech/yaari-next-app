import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class AuthApi {
  static const String _base = 'https://admin.yaari.me/api/auth';
  static const String _tcTokenUrl = 'https://oauth-account-noneu.truecaller.com/v1/token';
  static const String _tcUserinfoUrl = 'https://oauth-account-noneu.truecaller.com/v1/userinfo';
  static const String _tcRevokeUrl = 'https://oauth-account-noneu.truecaller.com/v1/revoke';

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
    try {
      final uri = Uri.parse('$_base/truecaller-oauth/exchange');
      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'authorizationCode': authorizationCode,
          'codeVerifier': codeVerifier,
        }),
      ).timeout(const Duration(seconds: 20));
      final body = _decodeBody(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return {'success': true, 'data': body['user'] ?? body};
      }
      return {
        'success': false,
        'message': _getErrorMessage(res.statusCode, body),
        'status': res.statusCode,
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Cannot connect to Truecaller authentication service',
        'status': 503,
      };
    }
  }

  static Future<Map<String, dynamic>> truecallerRefresh({required String refreshToken}) async {
    try {
      final res = await http.post(
        Uri.parse(_tcTokenUrl),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: 'grant_type=refresh_token&refresh_token=$refreshToken&client_id=fn_yohgvr75otxdy6eqursnetjuhk8b8xqdqzvahurs',
      ).timeout(const Duration(seconds: 10));
      final body = _decodeBody(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return {'success': true, 'data': body};
      }
      return {'success': false, 'message': _getErrorMessage(res.statusCode, body), 'status': res.statusCode};
    } catch (e) {
      return {'success': false, 'message': 'Cannot connect to Truecaller authentication service', 'status': 503};
    }
  }

  static Future<bool> truecallerRevoke({required String token}) async {
    try {
      final res = await http.post(
        Uri.parse(_tcRevokeUrl),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: 'token=$token&client_id=fn_yohgvr75otxdy6eqursnetjuhk8b8xqdqzvahurs',
      ).timeout(const Duration(seconds: 10));
      return res.statusCode >= 200 && res.statusCode < 300;
    } catch (e) {
      return false;
    }
  }
}
