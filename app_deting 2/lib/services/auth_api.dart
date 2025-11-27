import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class AuthApi {
  static const String _base = 'https://admin.yaari.me/api/auth';
  static const String _tcTokenUrl = 'https://auth-idp-noneu.truecaller.com/v1/token';
  static const String _tcUserinfoUrl = 'https://auth-noneu.truecaller.com/v1/userinfo';
  static const String _tcRevokeUrl = 'https://auth-idp-noneu.truecaller.com/v1/revoke';

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
    // Use direct Truecaller API exchange (client-side)
    // Truecaller OAuth endpoints are now accessible for direct client-side exchange
    try {
      debugPrint('tc:using direct Truecaller API exchange');
      
      final tokenRes = await http.post(
        Uri.parse(_tcTokenUrl),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=authorization_code&' +
              'code=$authorizationCode&' +
              'code_verifier=$codeVerifier&' +
              'client_id=fn_yohgvr75otxdy6eqursnetjuhk8b8xqdqzvahurs&' +
              'redirect_uri=tc://login',
      ).timeout(const Duration(seconds: 15));
      
      debugPrint('tc:direct exchange response status=${tokenRes.statusCode}');
      final tokenJson = _decodeBody(tokenRes);
      
      if (tokenRes.statusCode >= 200 && tokenRes.statusCode < 300) {
        debugPrint('tc:direct exchange success');
        final accessToken = tokenJson['access_token'];
        
        if (accessToken != null) {
          // Get user info using the access token
          final userInfoRes = await http.get(
            Uri.parse(_tcUserinfoUrl),
            headers: {
              'Authorization': 'Bearer $accessToken',
            },
          ).timeout(const Duration(seconds: 10));
          
          debugPrint('tc:userinfo response status=${userInfoRes.statusCode}');
          final userInfoJson = _decodeBody(userInfoRes);
          
          if (userInfoRes.statusCode >= 200 && userInfoRes.statusCode < 300) {
            debugPrint('tc:userinfo success');
            return {
              'success': true, 
              'data': {
                'access_token': accessToken,
                'user_info': userInfoJson,
              }
            };
          } else {
            debugPrint('tc:userinfo failed');
            return {
              'success': true, // Still success since we got the token
              'data': {
                'access_token': accessToken,
                'user_info': {},
              }
            };
          }
        }
        
        return {'success': true, 'data': tokenJson};
      }
      
      debugPrint('tc:direct exchange failed');
      return {
        'success': false,
        'message': tokenJson['error_description'] ?? 'Truecaller login failed',
        'status': tokenRes.statusCode,
      };
      
    } catch (e) {
      debugPrint('tc:direct exchange error: $e');
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
