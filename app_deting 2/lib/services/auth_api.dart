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
    // Direct token exchange (client-side) - bypasses server network issues
    try {
      debugPrint('tc:exchange starting client-side');
      final tokenRes = await http.post(
        Uri.parse(_tcTokenUrl),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: {
          'grant_type': 'authorization_code',
          'code': authorizationCode,
          'code_verifier': codeVerifier,
          'client_id': 'fn_yohgvr75otxdy6eqursnetjuhk8b8xqdqzvahurs',
        },
      ).timeout(const Duration(seconds: 10));
      
      debugPrint('tc:token response status=${tokenRes.statusCode}');
      final tokenJson = _decodeBody(tokenRes);
      final access = tokenJson['access_token']?.toString();
      
      if (tokenRes.statusCode >= 200 && tokenRes.statusCode < 300 && access != null && access.isNotEmpty) {
        debugPrint('tc:token success, fetching userinfo');
        final userRes = await http.get(
          Uri.parse(_tcUserinfoUrl),
          headers: {'Authorization': 'Bearer $access'},
        ).timeout(const Duration(seconds: 10));
        
        debugPrint('tc:userinfo response status=${userRes.statusCode}');
        final userJson = _decodeBody(userRes);
        
        if (userRes.statusCode >= 200 && userRes.statusCode < 300) {
          final phoneRaw = (userJson['phone_number'] ?? userJson['phoneNumber'] ?? userJson['phone'] ?? '').toString();
          final phone = phoneRaw.replaceAll(RegExp(r'^\+91\s*', caseSensitive: false), '').replaceAll(RegExp(r'\s+'), '');
          debugPrint('tc:extracted phone=$phone');
          
          if (RegExp(r'^[0-9]{10}$').hasMatch(phone)) {
            final user = {
              'phone': phone,
              'name': (userJson['name'] ?? userJson['given_name'] ?? '').toString().isEmpty ? null : (userJson['name'] ?? userJson['given_name']).toString(),
              'tcScopes': userJson['scopes'],
            };
            debugPrint('tc:login success');
            return {'success': true, 'data': user};
          } else {
            debugPrint('tc:invalid phone format');
          }
        }
        return {
          'success': false,
          'message': 'Failed to get user info from Truecaller',
          'status': userRes.statusCode,
        };
      }
      
      debugPrint('tc:token exchange failed');
      return {
        'success': false,
        'message': tokenJson['error_description'] ?? tokenJson['error'] ?? 'Truecaller token exchange failed',
        'status': tokenRes.statusCode,
      };
    } catch (e) {
      debugPrint('tc:client-side exchange error: $e');
      return {
        'success': false,
        'message': 'Cannot connect to Truecaller service',
        'status': 503,
      };
    }
  }
}
